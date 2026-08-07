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

export interface CircleErrorResponse {
  code: number;
  message: string;
}

// Only Arc Testnet is supported today — expand this union as we add chains.
export type ChainId = "ARC-TESTNET";

export type AccountType = "SCA" | "EOA";
