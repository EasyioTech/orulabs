"use client";

import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLayoutStore } from "@/store/layout";

export function ParticipantTopBar() {
  const { user, signOut } = useAuth();
  const { toggleMobileSidebar } = useLayoutStore();

  return (
    <header className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="text-[14px] font-bold text-brand-600 tracking-tight md:hidden">OruClass</span>
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-gray-500 hidden sm:block">{user.name}</span>
          <div className="w-8 h-8 rounded-full bg-[#e8f0fe] flex items-center justify-center text-[12px] font-bold text-[#1a73e8]">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </header>
  );
}
