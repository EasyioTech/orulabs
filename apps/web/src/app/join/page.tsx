"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth";
import { setTokens } from "@/lib/token-storage";
import { Loader2, LogIn, User } from "lucide-react";
import type { PublicUser } from "@oruclass/types";

type Step = "auth" | "code";

export default function JoinPage() {
  const router = useRouter();
  const { user, setUser, clearUser } = useAuthStore();
  const [step, setStep] = useState<Step>("auth");
  const [participantName, setParticipantName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  // If already logged in skip to code entry
  useEffect(() => {
    if (user) setStep("code");
  }, [user]);

  async function handleGuestLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!participantName.trim()) return;
    setNameLoading(true);
    try {
      const { data } = await apiClient.post("/api/auth/guest", { name: participantName });
      setTokens(data.accessToken);
      setUser({
        id: data.user.id,
        name: participantName,
        email: data.user.email,
        avatarUrl: data.user.avatarUrl,
        authProvider: "guest",
      });
      setStep("code");
    } catch (err) {
      console.error(err);
      alert("Failed to join. Please try again.");
    } finally {
      setNameLoading(false);
    }
  }

  function updateDigit(index: number, value: string) {
    const d = [...digits];
    d[index] = value.replace(/\D/g, "").slice(-1);
    setDigits(d);
    setCodeError(null);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const d = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) d[i] = pasted[i];
    setDigits(d);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleJoin() {
    const code = digits.join("");
    if (code.length < 6) { setCodeError("Enter all 6 digits"); return; }
    setCodeLoading(true);
    setCodeError(null);
    try {
      const { data: { joinToken } } = await apiClient.post<{ joinToken: string }>("/api/join/code", { code });
      const { data: { training } } = await apiClient.post<{ training: { id: string } }>(`/api/join/${joinToken}`);
      router.replace(`/trainings/${training.id}/live?role=participant`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      // 401/400 = our guest session lapsed (interceptor already purged the dead token).
      // Send them back to re-enter their name rather than surfacing "Refresh token is required".
      if (status === 401 || status === 400) {
        clearUser();
        setStep("auth");
        setCodeError(null);
        return;
      }
      setCodeError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          "No live session found with that code",
      );
    } finally {
      setCodeLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-bold text-gray-900">
              <span className="text-brand-600">Oru</span>Labs
            </h1>
          </Link>
          <p className="text-sm text-gray-500 mt-1">Join your live session</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          {step === "auth" ? (
            <form onSubmit={handleGuestLogin} className="space-y-4">
              <div>
                <h2 className="text-[15px] font-semibold text-gray-900">Welcome</h2>
                <p className="text-sm text-gray-500 mt-0.5">Please enter your name to join</p>
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
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                    placeholder="E.g., Alex Johnson"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!participantName.trim() || nameLoading}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                {nameLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Continue
              </button>
            </form>
          ) : (
            <>
              <div>
                <p className="text-[11px] text-gray-400 mb-0.5">Joining as {user?.name ?? "Participant"}</p>
                <h2 className="text-[15px] font-semibold text-gray-900">Enter session code</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Enter the 6-digit code shown on the screen
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    autoFocus={i === 0}
                    onChange={(e) => updateDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className={[
                      "w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-colors bg-white",
                      codeError
                        ? "border-red-300 text-red-600 focus:border-red-400"
                        : d
                        ? "border-brand-400 text-brand-700"
                        : "border-gray-100 text-gray-900 focus:border-brand-400",
                    ].join(" ")}
                  />
                ))}
              </div>

              {codeError && <p className="text-sm text-red-500 text-center">{codeError}</p>}

              <button
                onClick={handleJoin}
                disabled={digits.some((d) => !d) || codeLoading}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                {codeLoading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                Join Session
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
