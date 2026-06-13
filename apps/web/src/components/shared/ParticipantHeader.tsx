"use client";

import Link from "next/link";
import { UserCircle, Menu } from "lucide-react";
import { useLayoutStore } from "@/store/layout";

export function ParticipantHeader() {
  const toggleMobileSidebar = useLayoutStore((s) => s.toggleMobileSidebar);

  return (
    <header className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden p-1.5 -ml-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm font-bold tracking-tight text-brand-600">
          <Link href="/participant">OruLabs</Link>
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {/* We can add profile dropdown here later */}
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-100">
          <UserCircle size={20} />
        </div>
      </div>
    </header>
  );
}
