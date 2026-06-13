import type { Metadata } from "next";
import Link from "next/link";
import { Presentation, GraduationCap, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Sign In | OruLabs" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-[440px] mx-auto">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
        <div className="text-center mb-7">
          <h1 className="text-xl font-bold text-gray-900">Welcome to OruLabs</h1>
          <p className="text-sm text-gray-500 mt-1">How would you like to continue?</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/login/trainer"
            className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-400 hover:bg-brand-50/30 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors">
              <Presentation className="w-5 h-5 text-brand-600" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">I'm a Trainer</p>
              <p className="text-xs text-gray-500 mt-0.5">Host and manage live training sessions</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-500 transition-colors" />
          </Link>

          <Link
            href="/login/participant"
            className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-400 hover:bg-brand-50/30 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-100 transition-colors">
              <GraduationCap className="w-5 h-5 text-brand-600" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">I'm a Participant</p>
              <p className="text-xs text-gray-500 mt-0.5">Join with an invite link or 6-digit code</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-500 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
