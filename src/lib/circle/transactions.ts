// Server functions for Circle user-controlled wallet contract calls — the
// flow proven by scripts/circle-tx-hash-probe.mjs:
//
//   createCircleContractExecution  POST /user/transactions/contractExecution -> challengeId
//   (browser: sdk.execute(challengeId) -> the user approves on Circle's screen)
//   getCircleChallenge             GET  /user/challenges/{id}  -> status, correlationIds[0] = transaction id
//   getCircleTransaction           GET  /transactions/{id}     -> state, txHash
//
// All three return a result object instead of throwing: errors thrown from a
// server function reach the browser without Circle's error code.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CircleApiError, circleFetch } from "./client";

export type CircleCallFailure = { ok: false; code: number; status: number; message: string };

function toFailure(err: unknown): CircleCallFailure {
  if (err instanceof CircleApiError) {
    return { ok: false, code: err.code, status: err.status, message: err.message };
  }
  return { ok: false, code: 0, status: 0, message: err instanceof Error ? err.message : String(err) };
}

const hex = z.string().regex(/^0x[0-9a-fA-F]*$/);

const createInput = z.object({
  userToken: z.string(),
  walletId: z.string(),
  contractAddress: hex,
  callData: hex,
  refId: z.string().max(80).optional(),
});

export const createCircleContractExecution = createServerFn({ method: "POST" })
  .validator((input: unknown) => createInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: true; challengeId: string } | CircleCallFailure> => {
    try {
      const result = await circleFetch<{ challengeId: string }>("/user/transactions/contractExecution", {
        method: "POST",
        headers: { "X-User-Token": data.userToken },
        body: JSON.stringify({
          walletId: data.walletId,
          contractAddress: data.contractAddress,
          callData: data.callData,
          feeLevel: "MEDIUM",
          ...(data.refId ? { refId: data.refId } : {}),
        }),
      });
      return { ok: true, challengeId: result.challengeId };
    } catch (err) {
      return toFailure(err);
    }
  });

export interface CircleChallengeStatus {
  ok: true;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETE" | "FAILED" | "EXPIRED" | string;
  correlationIds: string[];
  errorCode?: number;
  errorMessage?: string;
}

const challengeInput = z.object({ userToken: z.string(), challengeId: z.string() });

export const getCircleChallenge = createServerFn({ method: "POST" })
  .validator((input: unknown) => challengeInput.parse(input))
  .handler(async ({ data }): Promise<CircleChallengeStatus | CircleCallFailure> => {
    try {
      const result = await circleFetch<{
        challenge?: { status: string; correlationIds?: string[]; errorCode?: number; errorMessage?: string };
      }>(`/user/challenges/${encodeURIComponent(data.challengeId)}`, {
        method: "GET",
        headers: { "X-User-Token": data.userToken },
      });
      const c = result.challenge ?? (result as unknown as NonNullable<typeof result.challenge>);
      return {
        ok: true,
        status: c.status,
        correlationIds: c.correlationIds ?? [],
        errorCode: c.errorCode,
        errorMessage: c.errorMessage,
      };
    } catch (err) {
      return toFailure(err);
    }
  });

export interface CircleTransactionStatus {
  ok: true;
  state: string;
  txHash: string | null;
  errorReason: string | null;
}

const transactionInput = z.object({ userToken: z.string(), transactionId: z.string() });

export const getCircleTransaction = createServerFn({ method: "POST" })
  .validator((input: unknown) => transactionInput.parse(input))
  .handler(async ({ data }): Promise<CircleTransactionStatus | CircleCallFailure> => {
    try {
      const result = await circleFetch<{
        transaction?: { state: string; txHash?: string; errorReason?: string };
      }>(`/transactions/${encodeURIComponent(data.transactionId)}`, {
        method: "GET",
        headers: { "X-User-Token": data.userToken },
      });
      const t = result.transaction ?? (result as unknown as NonNullable<typeof result.transaction>);
      return { ok: true, state: t.state, txHash: t.txHash ?? null, errorReason: t.errorReason ?? null };
    } catch (err) {
      return toFailure(err);
    }
  });
