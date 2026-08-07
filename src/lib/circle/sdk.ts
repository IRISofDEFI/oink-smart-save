import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

// The SDK's package root only exports the W3SSdk class, not its Configs/
// LoginCompleteCallback types, so derive them structurally instead of a
// fragile deep import into the package's dist internals.
type LoginCompleteCallback = NonNullable<Parameters<W3SSdk["updateConfigs"]>[1]>;

let sdkInstance: W3SSdk | null = null;

function readCircleAppId(): string {
  const appId = import.meta.env.VITE_CIRCLE_APP_ID as string | undefined;
  if (!appId) {
    throw new Error("VITE_CIRCLE_APP_ID is not set — add it to .env.local");
  }
  return appId;
}

function readGoogleClientId(): string {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!googleClientId) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is not set — add it to .env.local");
  }
  return googleClientId;
}

// Lazily constructs the W3SSdk singleton in the browser. Google login is
// wired with a real clientId, but deviceToken/deviceEncryptionKey are
// device-binding values from Circle's device-registration flow — they're
// placeholders here since they aren't needed for getDeviceId(), only for
// completing a login. Call configureCircleSdkForGoogleLogin() with real
// values (from getCircleDeviceToken) before calling
// performLogin(SocialLoginProvider.GOOGLE).
export function getCircleSdk(): W3SSdk {
  if (typeof window === "undefined") {
    throw new Error("getCircleSdk() must be called in the browser, not during SSR");
  }

  if (sdkInstance) {
    return sdkInstance;
  }

  sdkInstance = new W3SSdk({
    appSettings: { appId: readCircleAppId() },
    loginConfigs: {
      google: {
        clientId: readGoogleClientId(),
        redirectUri: window.location.origin,
      },
      deviceToken: "",
      deviceEncryptionKey: "",
    },
  });

  return sdkInstance;
}

// Applies real deviceToken/deviceEncryptionKey (from getCircleDeviceToken)
// and the login-complete callback to the singleton. updateConfigs() replaces
// the whole configs object rather than merging, so appSettings and the
// Google clientId/redirectUri are re-supplied here too.
export function configureCircleSdkForGoogleLogin(
  deviceCredentials: { deviceToken: string; deviceEncryptionKey: string },
  onLoginComplete: LoginCompleteCallback,
): W3SSdk {
  const sdk = getCircleSdk();

  sdk.updateConfigs(
    {
      appSettings: { appId: readCircleAppId() },
      loginConfigs: {
        google: {
          clientId: readGoogleClientId(),
          redirectUri: window.location.origin,
        },
        deviceToken: deviceCredentials.deviceToken,
        deviceEncryptionKey: deviceCredentials.deviceEncryptionKey,
      },
    },
    onLoginComplete,
  );

  return sdk;
}

// Circle's SDK only exports the W3SSdk class from its package root —
// SocialLoginProvider isn't public, and importing it from the package's
// dist/ internals is fragile: Circle could rename that path in a patch
// release and silently break login. Hardcoding the value is more robust.
// Docs: https://developers.circle.com/wallets/user-controlled/web-sdk
// This MUST match SocialLoginProvider.GOOGLE from @circle-fin/w3s-pw-web-sdk.
// Breakage check: if Google login stops working after bumping the SDK
// version, verify this string still matches SocialLoginProvider.GOOGLE in
// node_modules/@circle-fin/w3s-pw-web-sdk/dist/src/types.d.ts.
const GOOGLE_PROVIDER = "Google" as const;

type SocialLoginProviderParam = Parameters<W3SSdk["performLogin"]>[0];

// Call after configureCircleSdkForGoogleLogin() has set real device
// credentials — performLogin() redirects the browser to Google's OAuth page.
export function performGoogleLogin(sdk: W3SSdk): Promise<void> {
  return sdk.performLogin(GOOGLE_PROVIDER as SocialLoginProviderParam);
}
