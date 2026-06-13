"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth";
import { setTokens } from "@/lib/token-storage";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { Loader2, User } from "lucide-react";
import type { Training } from "@oruclass/types";

const GUEST_UPGRADE_KEY = "oru_guest_upgrade";

export default function JoinTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const token = unwrappedParams.token;
  const { user, isPending } = useAuth();
  const { setUser, clearUser } = useAuthStore();

  const [error, setError] = useState<string | null>(null);
  const [needsEntry, setNeedsEntry] = useState(false);
  const [mode, setMode] = useState<"signin" | "guest">("signin");
  const [hasJoined, setHasJoined] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [loading, setLoading] = useState(false);

  async function joinWithToken() {
    try {
      const { data } = await apiClient.post<{ training: Training }>(`/api/join/${token}`);
      router.replace(`/trainings/${data.training.id}/live?role=participant`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 400) {
        clearUser();
        setHasJoined(false);
        setNeedsEntry(true);
        return;
      }
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to join training",
      );
    }
  }

  useEffect(() => {
    if (isPending || hasJoined) return;
    if (!user) {
      setNeedsEntry(true);
      return;
    }

    setNeedsEntry(false);
    setHasJoined(true);

    // If a real (non-guest) account just signed in, try to merge any pending guest session
    const pendingGuestId = localStorage.getItem(GUEST_UPGRADE_KEY);
    if (pendingGuestId && user.authProvider !== "guest" && user.id !== pendingGuestId) {
      apiClient
        .post("/api/auth/upgrade-guest", { guestUserId: pendingGuestId })
        .catch(() => {})
        .finally(() => {
          localStorage.removeItem(GUEST_UPGRADE_KEY);
          joinWithToken();
        });
    } else {
      joinWithToken();
    }
  }, [user, isPending, hasJoined]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGuestJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!participantName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post("/api/auth/guest", { name: participantName.trim() });
      // Store guest ID so a later sign-in can merge the session
      localStorage.setItem(GUEST_UPGRADE_KEY, data.user.id);
      setTokens(data.accessToken);
      setUser({
        id: data.user.id,
        name: participantName.trim(),
        email: data.user.email,
        avatarUrl: data.user.avatarUrl,
        authProvider: "guest",
      });
      setNeedsEntry(false);
      setHasJoined(true);
      await joinWithToken();
    } catch {
      setError("Couldn't join right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Unable to join</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => { setError(null); setNeedsEntry(true); }}
            className="text-brand-600 hover:underline text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (needsEntry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              <span className="text-brand-600">Oru</span>Labs
            </h1>
            <p className="text-sm text-gray-500 mt-1">Join your live session</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
            {mode === "signin" ? (
              <>
                <div>
                  <h2 className="text-[15px] font-semibold text-gray-900">Sign in to join</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Your reflections &amp; history will be saved</p>
                </div>
                <EmailAuthForm returnTo={`/join/${token}`} />
                <p className="text-center text-xs text-gray-400">
                  or{" "}
                  <button
                    onClick={() => setMode("guest")}
                    className="text-gray-500 hover:text-gray-700 underline underline-offset-2"
                  >
                    continue without an account
                  </button>
                </p>
              </>
            ) : (
              <>
                <form onSubmit={handleGuestJoin} className="space-y-4">
                  <div>
                    <h2 className="text-[15px] font-semibold text-gray-900">Join as guest</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Enter your name to jump in — no account needed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                        placeholder="E.g., Alex Johnson"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!participantName.trim() || loading}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                    Join Session
                  </button>
                </form>
                <p className="text-center text-xs text-gray-400">
                  <button
                    onClick={() => setMode("signin")}
                    className="text-gray-500 hover:text-gray-700 underline underline-offset-2"
                  >
                    ← Sign in instead
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Joining training session…</p>
      </div>
    </div>
  );
}
