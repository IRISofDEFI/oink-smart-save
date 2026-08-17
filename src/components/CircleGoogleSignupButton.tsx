import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCircleSdk,
  configureCircleSdkForGoogleLogin,
  performGoogleLogin,
  getCircleDeviceToken,
  createCircleUser,
  createCircleWallet,
  listCircleWallets,
  getStoredUserToken,
  setStoredUserToken,
  setStoredUserId,
  getStoredWalletAddress,
  setStoredWalletAddress,
} from "@/lib/circle";

type SignupState =
  | { status: "idle" }
  | { status: "requesting-device-token" }
  | { status: "configuring-sdk" }
  | { status: "awaiting-google-popup" }
  | { status: "login-callback-processing" }
  | { status: "creating-circle-user" }
  | { status: "creating-wallet" }
  | { status: "success" }
  | { status: "error"; message: string };

type LoginCompleteCallback = Parameters<typeof configureCircleSdkForGoogleLogin>[1];
type LoginCompleteError = Parameters<LoginCompleteCallback>[0];
type LoginCompleteResult = Parameters<LoginCompleteCallback>[1];

const STATUS_LABELS: Record<Exclude<SignupState["status"], "idle" | "error">, string> = {
  "requesting-device-token": "Preparing sign-in…",
  "configuring-sdk": "Preparing sign-in…",
  "awaiting-google-popup": "Redirecting to Google…",
  "login-callback-processing": "Verifying your account…",
  "creating-circle-user": "Setting up your account…",
  "creating-wallet": "Creating your wallet…",
  success: "Redirecting…",
};

// Circle's userToken is short-lived and meant to be refreshed via
// getCircleUserToken; this is just how long we trust the copy we just
// received from the login callback for the "returning user" shortcut below.
const USER_TOKEN_ASSUMED_LIFETIME_MS = 60 * 60 * 1000;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

async function hashEmailToCircleUserId(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getErrorMessage(err: unknown): string {
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return "Connection issue. Check your internet and try again.";
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  if (typeof err === "string" && err) {
    return err;
  }
  return "Something went wrong. Please try again.";
}

function isUserAlreadyExistsError(err: unknown): boolean {
  const code = err && typeof err === "object" ? (err as { code?: unknown }).code : undefined;
  if (code === 155101) return true;
  const message = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return /already exist/i.test(message);
}

export function CircleGoogleSignupButton() {
  const navigate = useNavigate();
  const [state, setState] = useState<SignupState>({ status: "idle" });
  const hasAttemptedResume = useRef(false);

  // Step A + B. Runs both from the click handler (fresh flow) and from the
  // mount effect below (resuming after Google redirects back) — Circle's SDK
  // needs real device credentials configured on *this* page load before it
  // can detect and verify a returning OAuth hash.
  async function requestDeviceTokenAndConfigureSdk(onLoginComplete: LoginCompleteCallback) {
    setState({ status: "requesting-device-token" });
    const sdk = getCircleSdk();
    const deviceId = await sdk.getDeviceId();
    const { deviceToken, deviceEncryptionKey } = await getCircleDeviceToken({ data: { deviceId } });

    setState({ status: "configuring-sdk" });
    configureCircleSdkForGoogleLogin({ deviceToken, deviceEncryptionKey }, onLoginComplete);

    return sdk;
  }

  // Steps D-G. Shared by the click flow (Google returns while the tab is
  // still "live" only in the sense that this callback fires post-redirect)
  // and the mount-resume flow.
  async function handleLoginResult(error: LoginCompleteError, result: LoginCompleteResult) {
    try {
      console.log("[OinkAI Circle Callback] Fired with result:", JSON.stringify(result, null, 2));
      console.log("[OinkAI Circle Callback] Fired with error:", error);

      setState({ status: "login-callback-processing" });

      if (error || !result?.userToken) {
        console.error("[OinkAI Circle Callback] Login failed or missing userToken:", error, result);
        setState({ status: "error", message: error?.message ?? "Sign-in failed. Try again?" });
        return;
      }

      const { userToken, encryptionKey } = result;
      const oAuthInfo = "oAuthInfo" in result ? result.oAuthInfo : undefined;
      console.log("[OinkAI Circle Callback] Extracted oAuthInfo:", oAuthInfo);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- diagnostic probe of a field name not in the SDK's declared types, to compare against the socialUserInfo field we actually read below
      console.log(
        "[OinkAI Circle Callback] Extracted email (oAuthInfoForUser):",
        (oAuthInfo as any)?.oAuthInfoForUser?.email,
      );
      console.log("[OinkAI Circle Callback] Extracted email (socialUserInfo):", oAuthInfo?.socialUserInfo?.email);

      const email = oAuthInfo?.socialUserInfo?.email;
      if (!email) {
        console.error("[OinkAI Circle Callback] Email extraction failed. Full result:", result);
        setState({
          status: "error",
          message: "Could not extract email from Google response — response shape may have changed. Check console.",
        });
        return;
      }

      setStoredUserToken(userToken, encryptionKey, USER_TOKEN_ASSUMED_LIFETIME_MS);
      const userId = await hashEmailToCircleUserId(email);
      setStoredUserId(userId);

      setState({ status: "creating-circle-user" });
      try {
        await createCircleUser({ data: { userId } });
      } catch (err) {
        if (!isUserAlreadyExistsError(err)) throw err;
      }

      const existingWalletAddress = getStoredWalletAddress();
      if (!existingWalletAddress) {
        setState({ status: "creating-wallet" });
        const { challengeId } = await createCircleWallet({ data: { userToken } });

        await new Promise<void>((resolve, reject) => {
          getCircleSdk().execute(challengeId, (challengeError, challengeResult) => {
            if (challengeError || (challengeResult?.status as string | undefined) !== "COMPLETE") {
              reject(
                new Error(challengeError?.message ?? "Wallet creation didn't complete. Try again?"),
              );
              return;
            }
            resolve();
          });
        });

        const { wallets } = await listCircleWallets({ data: { userToken } });
        const wallet = wallets[0];
        if (!wallet) {
          setState({ status: "error", message: "Wallet was created but couldn't be found. Try again?" });
          return;
        }
        setStoredWalletAddress(wallet.address);
      }

      setState({ status: "success" });
      void navigate({ to: "/dashboard" });
    } catch (err) {
      console.error("[OinkAI Circle Callback] Unexpected error:", err);
      setState({ status: "error", message: getErrorMessage(err) });
    }
  }

  // Diagnostic only: Circle's SDK verifies the OAuth result via a hidden
  // iframe at pw-auth.circle.com, then posts the result back via
  // window.postMessage. Its own messageHandler silently drops any message
  // whose origin doesn't exactly match that service URL — no error, no
  // callback, nothing. Logging every raw message event here (before the
  // resume effect below starts the verification handshake) lets us see
  // whether a message ever arrives, and from what origin, independent of
  // whatever the SDK itself does with it.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      console.log(
        "[OinkAI Circle PostMessage] origin:",
        event.origin,
        "(expected https://pw-auth.circle.com) data:",
        event.data,
      );
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Resume after Google's OAuth redirect lands back on this page.
  // performGoogleLogin() does a full-page redirect (not a popup), so any
  // in-progress React state from the click that started it is gone — the
  // SDK signals a returning login by leaving OAuth params in the URL hash.
  useEffect(() => {
    if (hasAttemptedResume.current) return;
    hasAttemptedResume.current = true;
    if (typeof window === "undefined" || !window.location.hash) return;

    void (async () => {
      try {
        await requestDeviceTokenAndConfigureSdk((error, result) => {
          void handleLoginResult(error, result);
        });
      } catch (err) {
        console.error("Circle Google signup resume failed", err);
        setState({ status: "error", message: getErrorMessage(err) });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClick() {
    if (state.status !== "idle" && state.status !== "error") return;

    const storedToken = getStoredUserToken();
    const storedWallet = getStoredWalletAddress();
    if (storedToken && storedWallet) {
      void navigate({ to: "/dashboard" });
      return;
    }

    try {
      const sdk = await requestDeviceTokenAndConfigureSdk((error, result) => {
        void handleLoginResult(error, result);
      });

      setState({ status: "awaiting-google-popup" });
      console.log("[OinkAI Circle Button] About to call performLogin, sdk config:", sdk);
      await performGoogleLogin(sdk);
      console.log("[OinkAI Circle Button] performLogin resolved without error");
    } catch (err) {
      console.error("[OinkAI Circle Button] performLogin threw:", err);
      setState({ status: "error", message: getErrorMessage(err) });
    }
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={handleClick}
          className="h-14 rounded-full border-border bg-card/60 px-8 text-base font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-secondary/60"
        >
          <GoogleIcon className="h-5 w-5" />
          Sign up with Google
        </Button>
        <span className="max-w-xs text-center text-sm text-destructive">
          {state.message}{" "}
          <button
            type="button"
            onClick={() => setState({ status: "idle" })}
            className="font-medium underline underline-offset-2"
          >
            Try again?
          </button>
        </span>
      </div>
    );
  }

  const isLoading = state.status !== "idle";

  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      disabled={isLoading}
      onClick={handleClick}
      className="h-14 rounded-full border-border bg-card/60 px-8 text-base font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-secondary/60"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          {STATUS_LABELS[state.status as Exclude<SignupState["status"], "idle" | "error">]}
        </>
      ) : (
        <>
          <GoogleIcon className="h-5 w-5" />
          Sign up with Google
        </>
      )}
    </Button>
  );
}
