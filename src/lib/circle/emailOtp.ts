import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { circleFetch } from "./client";
import type { CircleEmailOtpToken } from "./types";

const requestCircleEmailOtpInput = z.object({
  deviceId: z.string(),
  email: z.string().email(),
});

// Sends the OTP email and returns the deviceToken/deviceEncryptionKey the
// browser SDK needs to bind the OTP to this device, plus the otpToken that
// identifies this specific OTP request for the SDK's verifyOtp() call.
export const requestCircleEmailOtp = createServerFn({ method: "POST" })
  .validator((input: unknown) => requestCircleEmailOtpInput.parse(input))
  .handler(async ({ data }) => {
    return circleFetch<CircleEmailOtpToken>("/users/email/token", {
      method: "POST",
      body: JSON.stringify({ deviceId: data.deviceId, email: data.email }),
    });
  });
