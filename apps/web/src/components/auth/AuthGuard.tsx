"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function AuthGuard({
  children,
  area,
}: {
  children: React.ReactNode;
  // "trainer" areas are off-limits to guests — they are participants only.
  area?: "trainer" | "participant";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isPending, isAuthenticated, emailVerified } = useAuth();
  const [mounted, setMounted] = useState(false);

  const isGuest = user?.authProvider === "guest";
  const guestBlocked = isGuest && area === "trainer";

  useEffect(() => {
    setMounted(true);
  }, []);

  // A guest can only ever be a participant. If one lands on a trainer route
  // (stale link, bookmarked dashboard, etc.) send them to the participant area.
  useEffect(() => {
    if (mounted && !isPending && isAuthenticated && guestBlocked) {
      router.replace("/participant");
    }
  }, [mounted, isPending, isAuthenticated, guestBlocked, router]);

  useEffect(() => {
    // Only redirect when:
    // 1. Component is mounted (hydrated)
    // 2. Session check is complete (not pending)
    // 3. User is not authenticated (either no user or session expired)
    if (mounted && !isPending && !isAuthenticated) {
      const loginPath = pathname.startsWith("/participant") ? "/login/participant" : "/login/trainer";
      router.replace(`${loginPath}?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, isPending, isAuthenticated, router, pathname]);

  // Redirect unverified email users to verify-email page.
  // Thread the intended landing so participants don't fall back to the trainer dashboard.
  useEffect(() => {
    if (mounted && !isPending && isAuthenticated && user && !emailVerified && user.authProvider !== "guest") {
      let intended: string | null = null;
      try { intended = localStorage.getItem("oru_return"); } catch {}
      const returnTo = intended ?? (pathname.startsWith("/participant") ? "/participant" : pathname);
      router.replace(`/verify-email?email=${encodeURIComponent(user.email)}&returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [mounted, isPending, isAuthenticated, user, emailVerified, router, pathname]);

  // Show children only if authenticated AND email verified (or guest),
  // and never render a trainer area for a guest (redirect is firing above).
  if (isAuthenticated && user && (emailVerified || user.authProvider === "guest") && !guestBlocked) {
    return <>{children}</>;
  }

  // Still loading or no user — show spinner (redirect will fire from effect above)
  if (!mounted || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No user, not pending — redirect is firing, show spinner while it happens
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
