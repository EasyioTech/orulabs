"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlayCircle, History } from "lucide-react";
import { useLayoutStore } from "@/store/layout";
import { cn } from "@oruclass/utils";
import { Logo } from "@/components/shared/Logo";

const navItems = [
  { href: "/participant", label: "Current Session", icon: PlayCircle, exact: true },
  { href: "/participant/previous", label: "Previous Sessions", icon: History, exact: false },
];

export function ParticipantSidebar() {
  const pathname = usePathname();
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useLayoutStore();

  return (
    <>
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "bg-white border-r border-gray-100 flex flex-col h-screen flex-shrink-0 transition-transform duration-300 md:w-[220px] md:relative md:translate-x-0 w-[260px] fixed z-50 left-0 top-0",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="text-[15px] font-semibold text-gray-900 tracking-tight">OruLabs</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-full text-[14px] transition-colors duration-150",
                  active
                    ? "bg-[#e8f0fe] text-[#1a73e8] font-bold"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium"
                )}
              >
                <Icon
                  size={18}
                  className={active ? "text-[#1a73e8]" : "text-gray-500"}
                  strokeWidth={active ? 2.5 : 2}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
