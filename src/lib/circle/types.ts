export interface CircleUser {
  id: string;
  createDate?: string;
}

export interface CircleUserToken {
  userToken: string;
  encryptionKey: string;
}

export interface CircleWalletChallenge {
  challengeId: string;
}

export interface CircleDeviceToken {
  deviceToken: string;
  deviceEncryptionKey: string;
}

// Response from POST /users/email/token — deviceToken/deviceEncryptionKey
// bind the OTP to this device; otpToken identifies the specific OTP request
// for the SDK's verifyOtp() call.
export interface CircleEmailOtpToken {
  deviceToken: string;
  deviceEncryptionKey: string;
  otpToken: string;
}

// Result of POST /user/initialize. Error code 155106 ("user already
// initialized") isn't fatal — it just means the caller should list existing
// wallets instead, so it's represented as a distinct success shape rather
// than an exception.
export type CircleInitializeUserResult =
  | { alreadyExists: false; challengeId: string }
  | { alreadyExists: true };

export interface CircleWallet {
  id: string;
  address: string;
  blockchain: ChainId;
  state: "LIVE" | "FROZEN";
  accountType: AccountType;
  custodyType: string;
  walletSetId: string;
  userId?: string;
  name?: string;
  refId?: string;
  createDate: string;
  updateDate: string;
}

export interface CircleTokenBalance {
  amount: string;
  token: {
    id?: string;
    blockchain?: ChainId;
    name?: string;
    symbol: string;
    decimals: number;
    isNative?: boolean;
    standard?: string;
  };
  updateDate?: string;
}

export interface CircleErrorResponse {
  code: number;
  message: string;
}

// Only Arc Testnet is supported today — expand this union as we add chains.
export type ChainId = "ARC-TESTNET";

export type AccountType = "SCA" | "EOA";
