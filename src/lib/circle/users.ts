import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { circleFetch } from "./client";
import type { CircleUser } from "./types";

const createCircleUserInput = z.object({
  userId: z.string(),
});

export const createCircleUser = createServerFn({ method: "POST" })
  .validator((input: unknown) => createCircleUserInput.parse(input))
  .handler(async ({ data }) => {
    await circleFetch<CircleUser>("/users", {
      method: "POST",
      body: JSON.stringify({ userId: data.userId }),
    });
    return { success: true, userId: data.userId };
  });
