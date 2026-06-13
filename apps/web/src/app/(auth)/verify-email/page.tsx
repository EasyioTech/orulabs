"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth";
import { setTokens } from "@/lib/token-storage";
import { CheckCircle2, Mail, RefreshCw, Loader2, GraduationCap } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [returnTo, setReturnTo] = useState(searchParams.get("returnTo") ?? "/participant");

  useEffect(() => {
    if (searchParams.get("returnTo")) return;
    try {
      const stored = localStorage.getItem("oru_return");
      if (stored) setReturnTo(stored);
    } catch {}
  }, [searchParams]);

  const { setEmailVerified, setUser } = useAuthStore();
  const [verifying, setVerifying] = useState(!!token);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [code, setCode] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processSuccess = (data: any) => {
    if (data.accessToken) setTokens(data.accessToken);
    if (data.user) {
      setUser({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatarUrl: data.user.avatarUrl,
        authProvider: data.user.isAnonymous ? "guest" : "email",
      });
    }
    setVerified(true);
    setEmailVerified(true);
  };

  useEffect(() => {
    if (!token) return;
    apiClient.post("/api/auth/verify-email", { token })
      .then(({ data }) => processSuccess(data))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((err) => setError(err.response?.data?.error || "Verification failed. The link may have expired."))
      .finally(() => setVerifying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (verified) {
      const t = setTimeout(() => router.push(returnTo), 1500);
      return () => clearTimeout(t);
    }
  }, [verified, returnTo, router]);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6 || !email) {
      setError(email ? "Enter a valid 6-digit code." : "Email is missing from the URL.");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const { data } = await apiClient.post("/api/auth/verify-email", { code, email });
      processSuccess(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || "Verification failed. Please check your code.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await apiClient.post("/api/auth/resend-verification", { returnTo });
      setResent(true);
    } catch {
      setError("Failed to resend. Please try logging in again.");
    } finally {
      setResending(false);
    }
  };

  if (verifying && !!token) {
    return (
      <div className="w-full max-w-[420px] mx-auto">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <Loader2 className="w-7 h-7 animate-spin text-brand-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Verifying your email…</p>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="w-full max-w-[420px] mx-auto">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center space-y-5">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Email verified!</h1>
            <p className="text-sm text-gray-500 mt-1">You're all set — redirecting…</p>
          </div>
          <button
            onClick={() => router.push(returnTo)}
            className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center">
            <GraduationCap size={22} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Verify your email</h1>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              We sent a code to{" "}
              {email ? <strong className="text-gray-700">{email}</strong> : "your email"}.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleCodeSubmit} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-center text-2xl tracking-[0.4em] font-bold text-gray-900 placeholder:text-gray-300 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            required
            maxLength={6}
          />
          <button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {verifying ? "Verifying…" : "Verify Code"}
          </button>
        </form>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <button
            onClick={handleResend}
            disabled={resending || resent}
            className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {resending ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending…</>
            ) : resent ? (
              <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Email sent!</>
            ) : (
              <><Mail className="w-3.5 h-3.5" /> Resend verification email</>
            )}
          </button>
          <Link
            href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
            className="block w-full py-2.5 text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to sign in
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center">Check your spam folder. The code expires in 24 hours.</p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
