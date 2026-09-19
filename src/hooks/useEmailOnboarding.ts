// Must import before the SDK below — sets up a global `process` shim that
// the SDK's CJS dependency chain (stream-browserify's readable-stream)
// needs present before its module code runs. See src/lib/process-shim.ts.
import "@/lib/process-shim";
import { useCallback, useEffect, useRef, useState } from "react";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import {
  requestCircleEmailOtp,
  initializeCircleUserWallet,
  listCircleUserWallets,
  getCircleWalletBalance,
  type CircleWallet,
  type CircleTokenBalance,
} from "@/lib/circle";

// The SDK's package root only exports the W3SSdk class, not its Configs/
// callback types (see src/lib/circle/sdk.ts for the same note) — derive them
// structurally instead of a fragile deep import into dist/ internals.
type LoginCompleteCallback = NonNullable<Parameters<W3SSdk["updateConfigs"]>[1]>;
type ChallengeCompleteCallback = NonNullable<Parameters<W3SSdk["execute"]>[1]>;

export type OnboardingStage = "email" | "otp" | "wallet" | "success";

interface AuthTokens {
  userToken: string;
  encryptionKey: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  // should show the PIN/security-question warning and wait for
  // confirmPinSetup() before opening Circle's hosted PIN-setup iframe.
  awaitingPinSetup: boolean;
  walletAlreadyExisted: boolean;
  wallet: CircleWallet | null;
  balance: CircleTokenBalance | null;
  submitEmail: (email: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  openVerify: () => void;
  confirmPinSetup: () => void;
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
  // In-memory only — never persisted to localStorage.
  const authRef = useRef<AuthTokens | null>(null);
  // React 19 strict-mode dev can invoke sdk.execute()'s callback twice for a
  // single call; this guards against double-handling (double listWallets
  // call, double stage advance).
  const challengeHandledRef = useRef(false);

  const refreshWalletAndBalance = useCallback(async (userToken: string) => {
    const { wallets } = await listCircleUserWallets({ data: { userToken } });
    const primary = wallets[0] ?? null;
    setWallet(primary);

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

  // Stage 3 entry point: called automatically once login completes. Not
  // user-triggered, so the PIN warning only shows up for genuinely new users
  // (existing users skip straight past it — see the alreadyExists branch).
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

    const onLoginComplete: LoginCompleteCallback = (loginError, result) => {
      log("onLoginComplete fired", { error: loginError, hasResult: !!result });
      if (loginError || !result) {
        setPending(false);
        setError(loginError?.message ?? "Verification failed. Please try again.");
        return;
      }
      authRef.current = { userToken: result.userToken, encryptionKey: result.encryptionKey };
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

  const confirmPinSetup = useCallback(() => {
    const sdk = sdkRef.current;
    const auth = authRef.current;
    const challengeId = pendingChallengeId;
    if (!sdk || !auth || !challengeId) return;

    setPending(true);
    setError(null);
    challengeHandledRef.current = false;

    sdk.setAuthentication({ userToken: auth.userToken, encryptionKey: auth.encryptionKey });

    const onCompleted: ChallengeCompleteCallback = (challengeError) => {
      log("sdk.execute() challenge callback fired", { error: challengeError });
      if (challengeHandledRef.current) return;
      challengeHandledRef.current = true;

      if (challengeError) {
        logError("PIN-setup challenge failed:", challengeError);
        setPending(false);
        setError(challengeError.message ?? "Wallet setup failed. Please try again.");
        return;
      }

      void (async () => {
        // Give Circle's indexer a moment before the wallet shows up in listWallets.
        await sleep(1500);
        try {
          await refreshWalletAndBalance(auth.userToken);
          setPendingChallengeId(null);
          setStage("success");
        } catch (err) {
          setError(describeError(err));
        } finally {
          setPending(false);
        }
      })();
    };

    sdk.execute(challengeId, onCompleted);
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
    awaitingPinSetup: pendingChallengeId !== null,
    walletAlreadyExisted,
    wallet,
    balance,
    submitEmail,
    resendOtp,
    openVerify,
    confirmPinSetup,
    retryInitialize,
  };
}
