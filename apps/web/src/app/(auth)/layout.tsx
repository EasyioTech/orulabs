"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, emailVerified, user, isPending } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && isAuthenticated && (emailVerified || user?.authProvider === "guest")) {
      let dest = "/participant";
      if (user?.authProvider !== "guest") {
        try { dest = localStorage.getItem("oru_return") ?? dest; } catch {}
      }
      router.replace(dest);
    }
  }, [isPending, isAuthenticated, emailVerified, user, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="h-14 border-b border-gray-100 bg-white flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <GraduationCap size={14} className="text-white" strokeWidth={2} />
          </div>
          <span className="text-[15px] font-semibold text-gray-900 tracking-tight group-hover:text-brand-700 transition-colors">
            OruLabs
          </span>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
