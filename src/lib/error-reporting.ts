export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[OinkAI] Unhandled error:", error, context);
}
