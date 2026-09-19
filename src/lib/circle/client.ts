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

// Circle wraps every successful response body in a `data` envelope
// (confirmed against their OpenAPI schema for /users/email/token and
// /user/initialize: both declare `{ data: { ... } }`, not a flat payload).
// Error responses are NOT wrapped — CircleErrorResponse stays flat, handled
// separately below.
interface CircleDataEnvelope<T> {
  data: T;
}

function hasDataEnvelope<T>(json: unknown): json is CircleDataEnvelope<T> {
  return typeof json === "object" && json !== null && "data" in json;
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
    // Error responses are flat — { code, message } — never wrapped in `data`.
    const error = json as CircleErrorResponse | undefined;
    throw new CircleApiError(
      error?.message ?? `Circle API request failed with status ${response.status}`,
      error?.code ?? response.status,
      response.status
    );
  }

  // Success responses are wrapped: { data: T }. Unwrap it so callers get the
  // payload shape their types already describe. Some endpoints (or an
  // unexpected response) may not have a `data` key — fall back to the raw
  // body rather than throwing, since that's still the best available value.
  if (hasDataEnvelope<T>(json)) {
    return json.data;
  }
  return json as T;
}
