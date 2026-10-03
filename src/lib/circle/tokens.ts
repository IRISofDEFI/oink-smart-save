import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CircleApiError, circleFetch } from "./client";
import type { CircleRefreshedUserToken, CircleUserToken } from "./types";

const getCircleUserTokenInput = z.object({
  userId: z.string(),
});

export const getCircleUserToken = createServerFn({ method: "POST" })
  .validator((input: unknown) => getCircleUserTokenInput.parse(input))
  .handler(async ({ data }) => {
    return circleFetch<CircleUserToken>("/users/token", {
      method: "POST",
      body: JSON.stringify({ userId: data.userId }),
    });
  });

const refreshCircleUserTokenInput = z.object({
  userToken: z.string(),
  refreshToken: z.string(),
  deviceId: z.string(),
});

export type RefreshCircleUserTokenResult =
  | ({ ok: true } & CircleRefreshedUserToken)
  | { ok: false; code: number; status: number; message: string };

// POST /v1/w3s/users/token/refresh (email/social login users). Exchanges the
// refreshToken from login for a new userToken + encryptionKey + refreshToken.
// Returns a result instead of throwing: errors thrown from a server function
// reach the browser without Circle's error code, and the caller needs the
// code to decide between "retry later" and "log in again".
export const refreshCircleUserToken = createServerFn({ method: "POST" })
  .validator((input: unknown) => refreshCircleUserTokenInput.parse(input))
  .handler(async ({ data }): Promise<RefreshCircleUserTokenResult> => {
    try {
      const result = await circleFetch<CircleRefreshedUserToken>("/users/token/refresh", {
        method: "POST",
        headers: { "X-User-Token": data.userToken },
        body: JSON.stringify({ refreshToken: data.refreshToken, deviceId: data.deviceId }),
      });
      return { ok: true, ...result };
    } catch (err) {
      if (err instanceof CircleApiError) {
        return { ok: false, code: err.code, status: err.status, message: err.message };
      }
      return { ok: false, code: 0, status: 0, message: err instanceof Error ? err.message : String(err) };
    }
  });
