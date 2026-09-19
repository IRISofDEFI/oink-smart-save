import type { CircleErrorResponse } from "./types";

const CIRCLE_BASE_URL = "https://api.circle.com/v1/w3s";

export class CircleApiError extends Error {
  code: number;
  status: number;

  constructor(message: string, code: number, status: number) {
    super(message);
    this.name = "CircleApiError";
    this.code = code;
    this.status = status;
  }
}

// Server-only: reads CIRCLE_API_KEY from process.env, adds idempotencyKey to
// POST bodies that don't already have one, and throws CircleApiError on non-2xx.
export async function circleFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiKey = process.env.CIRCLE_API_KEY;
  if (!apiKey) {
    throw new Error("CIRCLE_API_KEY is not set — add it to .env.local");
  }

  const { method = "GET", headers, body, ...rest } = options;

  let requestBody = body;
  if (method === "POST" && typeof body === "string") {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    if (!("idempotencyKey" in parsed)) {
      parsed.idempotencyKey = crypto.randomUUID();
    }
    requestBody = JSON.stringify(parsed);
  }

  const response = await fetch(`${CIRCLE_BASE_URL}${path}`, {
    ...rest,
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Request-Id": crypto.randomUUID(),
      ...headers,
    },
    body: requestBody,
  });

  const json = await response.json().catch(() => undefined);

  if (!response.ok) {
    const error = json as CircleErrorResponse | undefined;
    throw new CircleApiError(
      error?.message ?? `Circle API request failed with status ${response.status}`,
      error?.code ?? response.status,
      response.status
    );
  }

  return json as T;
}
