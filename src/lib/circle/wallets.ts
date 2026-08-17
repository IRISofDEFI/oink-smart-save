import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { circleFetch } from "./client";
import type { CircleWalletChallenge, CircleWalletsList } from "./types";

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

const listCircleWalletsInput = z.object({
  userToken: z.string(),
});

// The Web SDK's execute() challenge-complete callback only reports challenge
// type/status for a CREATE_WALLET challenge, not the created wallet's
// address — so after the challenge completes, the caller must look the
// wallet up separately via this endpoint.
export const listCircleWallets = createServerFn({ method: "POST" })
  .validator((input: unknown) => listCircleWalletsInput.parse(input))
  .handler(async ({ data }) => {
    return circleFetch<CircleWalletsList>("/wallets", {
      headers: { "X-User-Token": data.userToken },
    });
  });
