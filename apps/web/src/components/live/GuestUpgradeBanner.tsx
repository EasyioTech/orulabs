"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Sparkles, X } from "lucide-react";

const DISMISS_KEY = "oru-guest-banner-dismissed";

/**
 * Non-blocking nudge shown only to guest participants, encouraging them to
 * create an account so their reflections, responses and history are saved to a
 * participant dashboard. Dismissible for the session (sessionStorage) so it
 * never nags. Signing up returns them right back to the live room.
 */
export function GuestUpgradeBanner() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed || user?.authProvider !== "guest") return null;

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setDismissed(true);
  }

  function upgrade() {
    router.push(`/login/participant?returnTo=${encodeURIComponent(pathname)}`);
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-brand-50 border-b border-brand-200 flex-shrink-0">
      <Sparkles size={14} className="text-brand-600 flex-shrink-0" />
      <p className="text-[12.5px] text-brand-900 flex-1 leading-snug">
        <span className="font-semibold">Save your progress.</span>{" "}
        <span className="text-brand-700">
          Create a free account to keep your reflections &amp; history in your dashboard.
        </span>
      </p>
      <button
        onClick={upgrade}
        className="text-[12px] font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1 rounded-full transition-colors flex-shrink-0"
      >
        Save it
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-brand-400 hover:text-brand-600 transition-colors flex-shrink-0"
      >
        <X size={15} />
      </button>
    </div>
  );
}
