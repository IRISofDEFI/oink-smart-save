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

export interface CircleWallet {
  id: string;
  address: string;
  blockchain: ChainId;
  accountType: AccountType;
}

export interface CircleWalletsList {
  wallets: CircleWallet[];
}

export interface CircleDeviceToken {
  deviceToken: string;
  deviceEncryptionKey: string;
}

export interface CircleErrorResponse {
  code: number;
  message: string;
}

// Only Arc Testnet is supported today — expand this union as we add chains.
export type ChainId = "ARC-TESTNET";

export type AccountType = "SCA" | "EOA";
