"use client";

import { useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft, Mail } from "lucide-react";
import { GraduationCap } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiClient.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-[420px] mx-auto">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center space-y-5">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Mail className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Check your email</h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              We sent a reset link to <strong className="text-gray-700">{email}</strong>.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Didn't receive it?{" "}
              <button onClick={() => setSent(false)} className="text-brand-600 font-medium hover:text-brand-700">
                Try again
              </button>
            </p>
          </div>
        </div>
        <div className="text-center mt-4">
          <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 font-medium flex items-center justify-center gap-1">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
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
            <h1 className="text-xl font-bold text-gray-900">Forgot password?</h1>
            <p className="text-sm text-gray-500 mt-1">We'll send you a reset link.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            required
          />

          {error && (
            <div className="bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send Reset Link"}
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
