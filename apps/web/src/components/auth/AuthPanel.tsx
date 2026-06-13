"use client";

import { Logo } from "@/components/shared/Logo";
import Link from "next/link";
import { EmailAuthForm } from "./EmailAuthForm";

export function AuthPanel({
  title,
  subtitle,
  returnTo,
}: {
  title: string;
  subtitle: string;
  returnTo: string;
}) {
  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size={48} />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
        </div>

        <EmailAuthForm returnTo={returnTo} />
      </div>

      <div className="text-center mt-4">
        <Link href="/login" className="text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors">
          ← Choose a different role
        </Link>
      </div>
    </div>
  );
}
