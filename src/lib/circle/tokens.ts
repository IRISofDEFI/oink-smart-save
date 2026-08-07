import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { circleFetch } from "./client";
import type { CircleUserToken } from "./types";

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
