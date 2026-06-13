"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { isAxiosError } from "axios";
import { ArrowLeft, CheckCircle2, XCircle, Eye, EyeOff, GraduationCap } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-[420px] mx-auto p-10 text-center text-gray-400">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
  const allValid = Object.values(checks).every(Boolean);

  useEffect(() => {
    if (!token) setError("Invalid or missing reset token. Please request a new reset link.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }
    if (!allValid) { setError("Password doesn't meet requirements."); return; }
    setLoading(true);
    try {
      await apiClient.post("/api/auth/reset-password", { token, newPassword: password });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = isAxiosError(err) ? err.response?.data?.error || "" : "";
      setError(
        msg.includes("expired") || msg.includes("invalid")
          ? "This reset link has expired. Please request a new one."
          : msg || "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-[420px] mx-auto">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center space-y-5">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Password reset</h1>
            <p className="text-sm text-gray-500 mt-2">You can now sign in with your new password.</p>
          </div>
          <div className="space-y-2 pt-2">
            <Link href="/login/trainer" className="block w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors text-center">
              Sign in as Trainer
            </Link>
            <Link href="/login/participant" className="block w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors text-center">
              Sign in as Participant
            </Link>
          </div>
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
            <h1 className="text-xl font-bold text-gray-900">Set new password</h1>
            <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-11 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            required
            minLength={8}
          />

          {password && (
            <div className="grid grid-cols-2 gap-1.5 px-1">
              {([
                ["length", "8+ characters"],
                ["uppercase", "Uppercase"],
                ["lowercase", "Lowercase"],
                ["number", "Number"],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  {checks[key]
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                  <span className={`text-xs ${checks[key] ? "text-emerald-600" : "text-gray-400"}`}>{label}</span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      </div>

      <div className="text-center mt-4">
        <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 font-medium flex items-center justify-center gap-1">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
