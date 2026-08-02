/**
 * Guards against open-redirect attacks: only same-origin relative paths are allowed.
 * Anything protocol-relative ("//evil.com"), absolute-URL, or backslash-tricked
 * falls back to `fallback`.
 */
export function safeReturnTo(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  // Must be a root-relative path and not a protocol-relative / backslash bypass.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
