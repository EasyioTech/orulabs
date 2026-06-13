"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { apiClient } from "@/lib/api-client";
import { getAccessToken, clearTokens, isTokenExpired, setTokens } from "@/lib/token-storage";

export function useAuth() {
  const { user, isAuthenticated, isSessionExpired, emailVerified, setUser, setEmailVerified, clearUser, setSessionExpired } = useAuthStore();
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      if (isAuthenticated) setSessionExpired(true);
      setIsPending(false);
      return;
    }

    if (isTokenExpired(token)) {
      // Try refreshing — refresh token is sent via the httpOnly cookie.
      apiClient.post("/api/auth/refresh", {})
        .then(({ data }) => {
          setTokens(data.accessToken);
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            avatarUrl: data.user.avatarUrl,
            authProvider: data.user.isAnonymous ? "guest" : "email",
          });
          setEmailVerified(data.user.emailVerified ?? false);
        })
        .catch((err) => {
          // Only hard-logout when the refresh token is definitively rejected (401 or 400).
          // Survive network blips / API restarts so live participants aren't kicked out.
          if (err?.response?.status === 401 || err?.response?.status === 400) {
            clearUser();
            clearTokens();
          }
        })
        .finally(() => setIsPending(false));
      return;
    }

    // Token exists and is valid — verify with server if no user in store
    if (!user) {
      apiClient.get("/api/auth/me")
        .then(({ data }) => {
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            avatarUrl: data.user.avatarUrl,
            authProvider: data.user.isAnonymous ? "guest" : "email",
          });
          setEmailVerified(data.user.emailVerified ?? false);
        })
        .catch((err) => {
          // Same rule: only drop the session on a real auth rejection, ride out blips.
          if (err?.response?.status === 401 || err?.response?.status === 400) {
            clearUser();
            clearTokens();
          }
        })
        .finally(() => setIsPending(false));
    } else {
      setIsPending(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = useCallback(async () => {
    try {
      // Refresh token is read from / cleared via the httpOnly cookie server-side.
      await apiClient.post("/api/auth/logout", {});
    } catch { /* ignore */ }
    clearUser();
    clearTokens();
    window.location.href = "/login";
  }, [clearUser]);

  return { user, isAuthenticated, isSessionExpired, emailVerified, signOut: handleSignOut, isPending };
}
