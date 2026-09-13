export const REDACTED_AUTH_VALUE = "[REDACTED]" as const;

/**
 * Produces a log-safe copy. Auth-domain callers must pass any structured
 * diagnostic data through this boundary before it reaches a logger.
 */
export function redactCredentialLogValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactCredentialLogValue);
  if (!isRecord(value)) return value;

  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
    key,
    isSensitiveCredentialField(key) ? REDACTED_AUTH_VALUE : redactCredentialLogValue(entry),
  ]));
}

function isSensitiveCredentialField(key: string): boolean {
  return /password|credential|verifier|salt|token|cookie|authorization|csrf|(?:^|_)hash(?:$|_)/i.test(key);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
