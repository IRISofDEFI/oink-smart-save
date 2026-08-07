import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { circleFetch } from "./client";
import type { CircleDeviceToken } from "./types";

const getCircleDeviceTokenInput = z.object({
  deviceId: z.string(),
});

// Exchanges a browser deviceId (from sdk.getDeviceId()) for the deviceToken +
// deviceEncryptionKey required by loginConfigs before performLogin() can
// complete social-login verification with Circle's backend.
export const getCircleDeviceToken = createServerFn({ method: "POST" })
  .validator((input: unknown) => getCircleDeviceTokenInput.parse(input))
  .handler(async ({ data }) => {
    return circleFetch<CircleDeviceToken>("/users/social/token", {
      method: "POST",
      body: JSON.stringify({ deviceId: data.deviceId }),
    });
  });
