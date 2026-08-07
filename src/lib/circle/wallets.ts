import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { circleFetch } from "./client";
import type { CircleWalletChallenge } from "./types";

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
