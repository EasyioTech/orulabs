"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { apiClient } from "@/lib/api-client";
import { isAxiosError } from "axios";
import { setTokens } from "@/lib/token-storage";
import { UserCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export function EmailAuthForm(props: {
  returnTo?: string;
  initialMode?: "login" | "signup";
  onBack?: () => void;
}) {
  return (
    <Suspense fallback={<div className="h-64" />}>
      <EmailAuthFormInner {...props} />
    </Suspense>
  );
}

function EmailAuthFormInner({
  returnTo = "/dashboard",
  initialMode = "login",
  onBack,
}: {
  returnTo?: string;
  initialMode?: "login" | "signup";
  onBack?: () => void;
}) {
  const { user, isSessionExpired, clearUser, setUser, setEmailVerified } = useAuthStore();
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isContinueAs = isSessionExpired && user && isLogin;

  const [email, setEmail] = useState(isContinueAs ? user.email : "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const effectiveReturnTo = searchParams.get("returnTo") ?? returnTo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { data } = await apiClient.post("/api/auth/login", { email, password });
        setTokens(data.accessToken);
        try { localStorage.setItem("oru_return", effectiveReturnTo); } catch {}
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatarUrl: data.user.avatarUrl,
          authProvider: data.user.isAnonymous ? "guest" : "email",
        });
        setEmailVerified(data.user.emailVerified ?? true);
        router.push(effectiveReturnTo);
      } else {
        if (!name.trim()) {
          setError("Name is required.");
          setLoading(false);
          return;
        }
        const { data } = await apiClient.post("/api/auth/signup", { email, password, name, returnTo: effectiveReturnTo });
        setTokens(data.accessToken);
        try { localStorage.setItem("oru_return", effectiveReturnTo); } catch {}
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatarUrl: data.user.avatarUrl,
          authProvider: "email",
        });
        setEmailVerified(false);
        router.push(`/verify-email?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(effectiveReturnTo)}`);
      }
    } catch (err: unknown) {
      const errMsg = isAxiosError(err) ? err.response?.data?.error || err.message || "" : "";
      const errCode = isAxiosError(err) ? err.response?.data?.code || "" : "";

      if (errCode === "INVALID_CREDENTIALS" || errMsg.toLowerCase().includes("invalid")) {
        setError("No account found with this email, or incorrect password.");
      } else if (errCode === "USER_ALREADY_EXISTS") {
        setError("An account with this email already exists. Please sign in.");
      } else if (errCode === "WEAK_PASSWORD") {
        setError("Use at least 8 characters with uppercase, lowercase, and a number.");
      } else if (isAxiosError(err) && err.response?.status === 429) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError(errMsg || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {isContinueAs && (
        <div className="bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl text-center">
          <p className="text-sm font-medium text-amber-800">Session expired — sign in to continue</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {!isLogin && (
          <div>
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
              required={!isLogin}
            />
          </div>
        )}

        {isContinueAs ? (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full" />
              ) : (
                <UserCircle2 className="w-9 h-9 text-gray-400" />
              )}
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { clearUser(); setEmail(""); }}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Not you?
            </button>
          </div>
        ) : (
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            required
          />
        )}

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
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

        {isLogin && (
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors">
              Forgot password?
            </Link>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 mt-1"
        >
          {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className={`flex items-center ${onBack ? "justify-between" : "justify-center"} pt-1`}>
        {onBack && (
          <button type="button" onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back
          </button>
        )}
        <p className="text-sm text-gray-500 text-center">
          {isLogin ? "No account?" : "Already have one?"}{" "}
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
