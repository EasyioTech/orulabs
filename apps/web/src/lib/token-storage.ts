const ACCESS_TOKEN_KEY = "oruclass-access-token";
// Legacy key — refresh token now lives in an httpOnly cookie set by the API.
// Kept only so clearTokens() can purge any value left over from older builds.
const LEGACY_REFRESH_TOKEN_KEY = "oruclass-refresh-token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setTokens(accessToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  // Defensively drop any legacy localStorage refresh token.
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
