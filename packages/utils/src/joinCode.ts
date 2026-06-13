/**
 * Derives a deterministic 6-digit numeric code from a joinToken (any format).
 * Uses djb2 hash so it works with hex, base64url, or any string.
 */
export function joinTokenToCode(joinToken: string): string {
  let hash = 5381;
  for (let i = 0; i < joinToken.length; i++) {
    hash = (((hash << 5) + hash) ^ joinToken.charCodeAt(i)) >>> 0;
  }
  return (hash % 1_000_000).toString().padStart(6, "0");
}
