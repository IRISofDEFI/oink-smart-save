export const CIRCLE_USER_ID_KEY = "oink.circle.userId";
export const CIRCLE_USER_TOKEN_KEY = "oink.circle.userToken";
export const CIRCLE_USER_TOKEN_EXPIRY_KEY = "oink.circle.userTokenExpiry";
export const CIRCLE_ENCRYPTION_KEY_KEY = "oink.circle.encryptionKey";
export const CIRCLE_WALLET_ADDRESS_KEY = "oink.circle.walletAddress";

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CIRCLE_USER_ID_KEY);
}

export function setStoredUserId(userId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CIRCLE_USER_ID_KEY, userId);
}

export interface StoredUserToken {
  userToken: string;
  encryptionKey: string;
  expiry: number;
}

export function getStoredUserToken(): StoredUserToken | null {
  if (typeof window === "undefined") return null;

  const userToken = window.localStorage.getItem(CIRCLE_USER_TOKEN_KEY);
  const encryptionKey = window.localStorage.getItem(CIRCLE_ENCRYPTION_KEY_KEY);
  const expiryRaw = window.localStorage.getItem(CIRCLE_USER_TOKEN_EXPIRY_KEY);

  if (!userToken || !encryptionKey || !expiryRaw) return null;

  const expiry = Number(expiryRaw);
  if (Number.isNaN(expiry)) return null;

  return { userToken, encryptionKey, expiry };
}

export function setStoredUserToken(userToken: string, encryptionKey: string, expiresInMs: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CIRCLE_USER_TOKEN_KEY, userToken);
  window.localStorage.setItem(CIRCLE_ENCRYPTION_KEY_KEY, encryptionKey);
  window.localStorage.setItem(CIRCLE_USER_TOKEN_EXPIRY_KEY, String(Date.now() + expiresInMs));
}

export function getStoredWalletAddress(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CIRCLE_WALLET_ADDRESS_KEY);
}

export function setStoredWalletAddress(address: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CIRCLE_WALLET_ADDRESS_KEY, address);
}

export function clearAllCircleStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CIRCLE_USER_ID_KEY);
  window.localStorage.removeItem(CIRCLE_USER_TOKEN_KEY);
  window.localStorage.removeItem(CIRCLE_USER_TOKEN_EXPIRY_KEY);
  window.localStorage.removeItem(CIRCLE_ENCRYPTION_KEY_KEY);
  window.localStorage.removeItem(CIRCLE_WALLET_ADDRESS_KEY);
}
