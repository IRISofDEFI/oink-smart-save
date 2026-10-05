import { useCallback, useEffect, useRef, useState } from "react";
// Type-only: erased at build time, so it carries no runtime dependency on
// the package. The real module is loaded with a dynamic import() inside the
// client-only mount effect below (see the comment there) — a static runtime
// import here would pull the SDK's jsonwebtoken/jws/jwa chain (which does
// plain require('stream')/require('util')/require('buffer')/require('crypto'))
// into the SSR bundle, where evaluating it replaces Node's real `util` with
// the browser shim and crashes every request with
// "TypeError: util.TextEncoder is not a constructor".
import type { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import {
  requestCircleEmailOtp,
  initializeCircleUserWallet,
  listCircleUserWallets,
  getCircleWalletBalance,
  saveEmailSession,
  getCircleChallenge,
  type CircleWallet,
  type CircleTokenBalance,
} from "@/lib/circle";
import { watchHostedScreen } from "@/lib/circle/hostedScreen";

// The SDK's package root only exports the W3SSdk class, not its Configs/
// callback types (see src/lib/circle/sdk.ts for the same note) — derive them
// structurally instead of a fragile deep import into dist/ internals.
type LoginCompleteCallback = NonNullable<Parameters<W3SSdk["updateConfigs"]>[1]>;
type ChallengeCompleteCallback = NonNullable<Parameters<W3SSdk["execute"]>[1]>;

export type OnboardingStage = "email" | "otp" | "wallet" | "success";

interface AuthTokens {
  userToken: string;
  encryptionKey: string;
  refreshToken: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Upper bound on the whole wallet-setup step once Circle's screen is open. */
const WALLET_SETUP_TIMEOUT_MS = 10 * 60 * 1000;
/** Circle Web SDK error code for "user closed the screen". */
const SDK_USER_CANCELED = 155701;

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Something went wrong. Please try again.";
  }
}

// Tagged so it's easy to filter in the browser console while debugging the
// onboarding flow — we've hit silent-failure bugs here before.
const LOG_TAG = "[EmailOnboarding]";
const log = (...args: unknown[]) => console.log(LOG_TAG, ...args);
const logError = (...args: unknown[]) => console.error(LOG_TAG, ...args);

export interface UseEmailOnboardingResult {
  // Fatal: SDK can't be constructed at all (e.g. missing env var).
  configError: string | null;
  stage: OnboardingStage;
  pending: boolean;
  error: string | null;
  email: string;
  // True once initializeCircleUserWallet() returned a challengeId — the UI
  // explains what happens next and waits for confirmWalletSetup() before
  // opening Circle's secure screen.
  awaitingWalletSetup: boolean;
  walletAlreadyExisted: boolean;
  wallet: CircleWallet | null;
  balance: CircleTokenBalance | null;
  submitEmail: (email: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  openVerify: () => void;
  confirmWalletSetup: () => void;
  retryInitialize: () => void;
}

export function useEmailOnboarding(): UseEmailOnboardingResult {
  const [configError, setConfigError] = useState<string | null>(null);
  const [stage, setStage] = useState<OnboardingStage>("email");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null);
  const [walletAlreadyExisted, setWalletAlreadyExisted] = useState(false);
  const [wallet, setWallet] = useState<CircleWallet | null>(null);
  const [balance, setBalance] = useState<CircleTokenBalance | null>(null);

  const sdkRef = useRef<W3SSdk | null>(null);
  // Diagnostic only — confirms the SAME SDK instance is alive across the
  // Stage 1 -> Stage 2 transition (rules out StrictMode/remount recreating it).
  const sdkInstanceIdRef = useRef<string | null>(null);
  const appIdRef = useRef<string | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  // Login tokens for this sign-up. Persisted (via saveEmailSession) only once
  // the wallet is known, so a half-finished sign-up never leaves a session.
  const authRef = useRef<AuthTokens | null>(null);
  // Mirrors `email` state for use inside callbacks created before it's set.
  const emailRef = useRef("");
  // Identifies the latest wallet-setup attempt, so a superseded attempt
  // (e.g. the user pressed "Try again") can't update state after it ends.
  const setupRunRef = useRef(0);

  const refreshWalletAndBalance = useCallback(async (userToken: string) => {
    const { wallets } = await listCircleUserWallets({ data: { userToken } });
    const primary = wallets[0] ?? null;
    setWallet(primary);

    // Persist the email session so it survives navigation and reload. Only
    // tokens and wallet identity are stored — never the PIN or security answers.
    const auth = authRef.current;
    const deviceId = deviceIdRef.current;
    if (primary && auth && deviceId) {
      saveEmailSession({
        userToken: auth.userToken,
        encryptionKey: auth.encryptionKey,
        refreshToken: auth.refreshToken,
        deviceId,
        walletId: primary.id,
        address: primary.address,
        email: emailRef.current || undefined,
      });
      log("email session saved", { walletId: primary.id, address: primary.address });
    } else if (primary) {
      logError("wallet found but session incomplete — not persisted", {
        hasAuth: !!auth,
        hasDeviceId: !!deviceId,
      });
    }

    if (primary) {
      const { tokenBalances } = await getCircleWalletBalance({
        data: { walletId: primary.id, userToken },
      });
      const usdc = tokenBalances.find((b) => b.token.symbol === "USDC") ?? tokenBalances[0] ?? null;
      setBalance(usdc);
    } else {
      setBalance(null);
    }
  }, []);

  // Stage 3 entry point: called automatically once login completes. Only
  // users Circle hasn't initialized yet get a setup challenge (and the setup
  // screen); initialized users skip straight past it — see alreadyExists.
  // In Circle's confirm-only mode, email login usually initializes the user
  // already, so most new users take the alreadyExists path too.
  const beginWalletInitialize = useCallback(
    async (userToken: string) => {
      setPending(true);
      setError(null);
      try {
        const result = await initializeCircleUserWallet({ data: { userToken } });
        if (result.alreadyExists) {
          setWalletAlreadyExisted(true);
          await refreshWalletAndBalance(userToken);
          setStage("success");
          setPending(false);
          return;
        }
        setPendingChallengeId(result.challengeId);
        setPending(false);
      } catch (err) {
        setPending(false);
        setError(describeError(err));
      }
    },
    [refreshWalletAndBalance],
  );

  useEffect(() => {
    log("mount effect running");

    const appId = import.meta.env.VITE_CIRCLE_APP_ID as string | undefined;
    log("VITE_CIRCLE_APP_ID:", appId ? `set (${appId})` : "MISSING");
    if (!appId) {
      logError("VITE_CIRCLE_APP_ID is not set — cannot construct the Circle SDK");
      setConfigError(
        "Email sign-up isn't configured yet (missing VITE_CIRCLE_APP_ID). Please connect a wallet instead.",
      );
      return;
    }
    appIdRef.current = appId;

    // useEffect never runs during SSR (React only fires effects after
    // client-side hydration), so this dynamic import — and everything it
    // pulls in — never loads or evaluates on the server. That's what keeps
    // it out of the request path that crashed production; see the
    // import-type comment at the top of the file for the "why".
    void (async () => {
      // Must run before the SDK import below — sets up a global `process`
      // shim that the SDK's CJS dependency chain (stream-browserify's
      // readable-stream) needs present before its module code runs.
      // Dynamic: it's only needed alongside the SDK, and keeping it out of
      // the SSR graph removes any doubt about it being a static import.
      //
      // The shim is invoked as a function rather than imported for its
      // side effect. A bare `await import("@/lib/process-shim")` looked
      // correct and still failed in production: `"sideEffects": false` in
      // package.json let Rolldown drop the exportless module's body from
      // the built chunk, so nothing ever assigned globalThis.process and
      // the SDK chunk threw "process is not defined". See the long note in
      // src/lib/process-shim.ts.
      const { installProcessShim } = await import("@/lib/process-shim");
      installProcessShim();

      const { W3SSdk } = await import("@circle-fin/w3s-pw-web-sdk");

      const onLoginComplete: LoginCompleteCallback = (loginError, result) => {
        log("onLoginComplete fired", { error: loginError, hasResult: !!result });
        if (loginError || !result) {
          setPending(false);
          setError(loginError?.message ?? "Verification failed. Please try again.");
          return;
        }
        authRef.current = {
          userToken: result.userToken,
          encryptionKey: result.encryptionKey,
          refreshToken: result.refreshToken,
        };
        setError(null);
        setPending(false);
        setStage("wallet");
        void beginWalletInitialize(result.userToken);
      };

      if (!sdkRef.current) {
        try {
          sdkRef.current = new W3SSdk({ appSettings: { appId } }, onLoginComplete);
          sdkInstanceIdRef.current = Math.random().toString(36).slice(2, 10);
          log("W3SSdk constructed successfully, instance id:", sdkInstanceIdRef.current);
        } catch (err) {
          logError("W3SSdk constructor threw:", err);
          setConfigError(`Failed to initialize the sign-up SDK: ${describeError(err)}`);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitEmail = useCallback(async (rawEmail: string) => {
    log("submitEmail called with:", rawEmail);

    const sdk = sdkRef.current;
    const appId = appIdRef.current;
    if (!sdk || !appId) {
      logError("submitEmail aborted — SDK not ready", { hasSdk: !!sdk, hasAppId: !!appId });
      setError(
        "The sign-up form isn't ready yet (SDK not initialized). Please wait a moment and try again.",
      );
      return;
    }

    const trimmed = rawEmail.trim();
    if (!trimmed) {
      setError("Enter your email address");
      return;
    }

    setPending(true);
    setError(null);

    let deviceId: string;
    try {
      log("calling sdk.getDeviceId()...");
      deviceId = await sdk.getDeviceId();
      log("sdk.getDeviceId() succeeded:", deviceId);
    } catch (err) {
      logError("sdk.getDeviceId() failed:", err);
      setError(`Couldn't reach Circle's sign-up service: ${describeError(err)}`);
      setPending(false);
      return;
    }
    deviceIdRef.current = deviceId;

    try {
      log("calling requestCircleEmailOtp...", { deviceId, email: trimmed });
      const rawResponse = await requestCircleEmailOtp({
        data: { deviceId, email: trimmed },
      });
      // Diagnostic: log the RAW response shape before destructuring anything
      // off it — this is what would reveal a wrapper envelope (e.g. Circle
      // returning { data: { deviceToken, ... } } instead of the flat shape
      // our types claim) that a `!!deviceToken`-style boolean log would hide.
      log("requestCircleEmailOtp raw response:", JSON.stringify(rawResponse));

      const { deviceToken, deviceEncryptionKey, otpToken } = rawResponse;
      log("destructured tokens", {
        deviceToken,
        deviceEncryptionKey,
        otpToken,
      });

      const loginConfigs = { deviceToken, deviceEncryptionKey, otpToken };
      log(
        "calling sdk.updateConfigs() on SDK instance",
        sdkInstanceIdRef.current,
        "with loginConfigs:",
        JSON.stringify(loginConfigs),
      );
      sdk.updateConfigs({
        appSettings: { appId },
        loginConfigs,
      });
      log("sdk.updateConfigs() call completed");

      setEmail(trimmed);
      emailRef.current = trimmed;
      setStage("otp");
    } catch (err) {
      logError("requestCircleEmailOtp failed:", err);
      setError(describeError(err));
    } finally {
      setPending(false);
    }
  }, []);

  const resendOtp = useCallback(async () => {
    const sdk = sdkRef.current;
    const appId = appIdRef.current;
    const deviceId = deviceIdRef.current;
    if (!sdk || !appId || !deviceId || !email) return;

    setPending(true);
    setError(null);
    try {
      const rawResponse = await requestCircleEmailOtp({
        data: { deviceId, email },
      });
      log("resendOtp raw response:", JSON.stringify(rawResponse));
      const { deviceToken, deviceEncryptionKey, otpToken } = rawResponse;
      sdk.updateConfigs({
        appSettings: { appId },
        loginConfigs: { deviceToken, deviceEncryptionKey, otpToken },
      });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setPending(false);
    }
  }, [email]);

  const openVerify = useCallback(() => {
    const sdk = sdkRef.current;
    log(
      "openVerify called. SDK instance id:",
      sdkInstanceIdRef.current,
      "deviceIdRef.current:",
      deviceIdRef.current,
      "sdk present:",
      !!sdk,
    );
    if (!sdk) {
      logError("openVerify aborted — no SDK instance");
      return;
    }
    setError(null);
    setPending(true);
    // Opens Circle's hosted iframe; the result arrives asynchronously via
    // the onLoginComplete callback registered at construction.
    log("calling sdk.verifyOtp() on instance", sdkInstanceIdRef.current, "...");
    sdk.verifyOtp();
    log("sdk.verifyOtp() call returned (result arrives async via onLoginComplete)");
  }, []);

  // Wallet setup for a user Circle hasn't initialized yet: opens Circle's
  // secure screen for the initialize challenge. What that screen asks for is
  // Circle's choice (in confirm-only mode it's just a confirmation; older
  // configurations may ask for a PIN + security questions) — we never see it.
  //
  // Completion comes from polling the SERVER for the challenge status; the SDK
  // callback is only a hint (it's unreliable). And because the SDK's own
  // "no response" timeout can be disabled on this instance (see
  // lib/circle/hostedScreen.ts), we watch for Circle's screen ourselves, so a
  // screen that never appears becomes a visible error instead of a hang.
  const confirmWalletSetup = useCallback(() => {
    const sdk = sdkRef.current;
    const auth = authRef.current;
    const challengeId = pendingChallengeId;
    if (!sdk || !auth || !challengeId) {
      logError("confirmWalletSetup: missing prerequisite — not opening Circle's screen", {
        hasSdk: !!sdk,
        hasAuth: !!auth,
        hasChallenge: !!challengeId,
      });
      setError(
        !sdk
          ? "Circle's secure screen isn't ready yet. Refresh the page and try again."
          : "Your sign-up session was lost. Please start again with your email.",
      );
      return;
    }

    const runId = ++setupRunRef.current;
    const stillCurrent = () => setupRunRef.current === runId;
    setPending(true);
    setError(null);

    sdk.setAuthentication({ userToken: auth.userToken, encryptionKey: auth.encryptionKey });

    let callbackError: { code?: number; message?: string } | null = null;
    const onCompleted: ChallengeCompleteCallback = (challengeError) => {
      log("sdk.execute() callback fired", { error: challengeError ?? null });
      if (challengeError) callbackError = challengeError as { code?: number; message?: string };
    };

    const watch = watchHostedScreen();
    log("opening Circle's secure screen for wallet setup", { challengeId });
    sdk.execute(challengeId, onCompleted);

    void (async () => {
      try {
        await watch.opened; // rejects if Circle never shows its screen
        log("Circle's secure screen is open — waiting for the user to finish");

        const deadline = Date.now() + WALLET_SETUP_TIMEOUT_MS;
        let endSignalSeen = false;
        for (;;) {
          const res = await getCircleChallenge({ data: { userToken: auth.userToken, challengeId } });
          if (res.ok && res.status === "COMPLETE") break;
          if (res.ok && res.status === "EXPIRED") throw new Error("The setup request expired. Please try again.");
          if (res.ok && res.status === "FAILED") {
            throw new Error(`Circle couldn't finish setting up your wallet${res.errorMessage ? `: ${res.errorMessage}` : "."}`);
          }
          // The user closed Circle's screen, or the SDK reported an error, and
          // the server still isn't COMPLETE after one more check: stop waiting.
          if (watch.closed() || callbackError) {
            if (endSignalSeen) {
              const cbErr = callbackError as { code?: number; message?: string } | null;
              if (!cbErr || cbErr.code === SDK_USER_CANCELED) {
                throw new Error("Wallet setup was cancelled — Circle's screen was closed before finishing.");
              }
              throw new Error(cbErr.message || "Wallet setup failed on Circle's screen.");
            }
            endSignalSeen = true;
          }
          if (Date.now() > deadline) throw new Error("Wallet setup timed out. Please try again.");
          await sleep(2000);
        }

        log("wallet setup challenge complete");
        // Give Circle's indexer a moment before the wallet shows up in listWallets.
        await sleep(1500);
        await refreshWalletAndBalance(auth.userToken);
        if (stillCurrent()) {
          setPendingChallengeId(null);
          setStage("success");
        }
      } catch (err) {
        logError("wallet setup failed:", err);
        if (stillCurrent()) setError(describeError(err));
      } finally {
        watch.stop();
        if (stillCurrent()) setPending(false);
      }
    })();
  }, [pendingChallengeId, refreshWalletAndBalance]);

  const retryInitialize = useCallback(() => {
    const auth = authRef.current;
    if (!auth) return;
    void beginWalletInitialize(auth.userToken);
  }, [beginWalletInitialize]);

  return {
    configError,
    stage,
    pending,
    error,
    email,
    awaitingWalletSetup: pendingChallengeId !== null,
    walletAlreadyExisted,
    wallet,
    balance,
    submitEmail,
    resendOtp,
    openVerify,
    confirmWalletSetup,
    retryInitialize,
  };
}
