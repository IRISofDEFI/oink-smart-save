import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CircleApiError, circleFetch } from "./client";
import type {
  CircleInitializeUserResult,
  CircleTokenBalance,
  CircleWallet,
  CircleWalletChallenge,
} from "./types";

const createCircleWalletInput = z.object({
  userToken: z.string(),
});

export const createCircleWallet = createServerFn({ method: "POST" })
  .validator((input: unknown) => createCircleWalletInput.parse(input))
  .handler(async ({ data }) => {
    // User-scoped endpoint — auth is the caller's userToken, not just the API key.
    return circleFetch<CircleWalletChallenge>("/user/wallets", {
      method: "POST",
      headers: { "X-User-Token": data.userToken },
      body: JSON.stringify({
        accountType: "SCA",
        blockchains: ["ARC-TESTNET"],
      }),
    });
  });

const CIRCLE_USER_ALREADY_INITIALIZED_CODE = 155106;

const initializeCircleUserWalletInput = z.object({
  userToken: z.string(),
});

// Initializes a fresh Circle user with a wallet-creation challenge. Error
// code 155106 means the user already has wallets — not fatal, the caller
// should call listCircleUserWallets() instead of retrying this.
export const initializeCircleUserWallet = createServerFn({ method: "POST" })
  .validator((input: unknown) => initializeCircleUserWalletInput.parse(input))
  .handler(async ({ data }): Promise<CircleInitializeUserResult> => {
    try {
      const result = await circleFetch<{ challengeId: string }>("/user/initialize", {
        method: "POST",
        headers: { "X-User-Token": data.userToken },
        body: JSON.stringify({
          accountType: "SCA",
          blockchains: ["ARC-TESTNET"],
        }),
      });
      return { alreadyExists: false, challengeId: result.challengeId };
    } catch (err) {
      if (err instanceof CircleApiError && err.code === CIRCLE_USER_ALREADY_INITIALIZED_CODE) {
        return { alreadyExists: true };
      }
      throw err;
    }
  });

const listCircleUserWalletsInput = z.object({
  userToken: z.string(),
});

export const listCircleUserWallets = createServerFn({ method: "POST" })
  .validator((input: unknown) => listCircleUserWalletsInput.parse(input))
  .handler(async ({ data }) => {
    return circleFetch<{ wallets: CircleWallet[] }>("/wallets?blockchain=ARC-TESTNET", {
      method: "GET",
      headers: { "X-User-Token": data.userToken },
    });
  });

const getCircleWalletBalanceInput = z.object({
  walletId: z.string(),
  userToken: z.string(),
});

// `amount` on each returned tokenBalance is already human-readable
// (e.g. "5.00") — do not run it through parseUnits/formatUnits again.
export const getCircleWalletBalance = createServerFn({ method: "POST" })
  .validator((input: unknown) => getCircleWalletBalanceInput.parse(input))
  .handler(async ({ data }) => {
    return circleFetch<{ tokenBalances: CircleTokenBalance[] }>(
      `/wallets/${data.walletId}/balances`,
      {
        method: "GET",
        headers: { "X-User-Token": data.userToken },
      }
    );
  });
