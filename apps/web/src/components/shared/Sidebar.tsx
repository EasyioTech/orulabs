"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  GraduationCap,
  Users,
  CalendarDays,
  Database,
  CreditCard,
  Crown,
  Sparkles,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { useLayoutStore } from "@/store/layout";
import { useSubscriptionStore } from "@/store/subscription";
import { cn } from "@oruclass/utils";
import { getPlan } from "@/config/plans";

const trainerNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, exact: false },
  { href: "/data", label: "Data", icon: Database, exact: false },
  { href: "/trainings/new", label: "New Training", icon: PlusCircle, exact: false },
  { href: "/shared", label: "Shared with Me", icon: Users, exact: false },
];

const participantNavItems = [
  { href: "/participant", label: "My Sessions", icon: Users, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: workspaces } = useWorkspaces();
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();
  const { isMobileSidebarOpen, setMobileSidebarOpen, isDesktopSidebarOpen } = useLayoutStore();
  const { planId, status } = useSubscriptionStore();
  const isPro = status === "active";
  const currentPlan = planId ? getPlan(planId) : null;

  useEffect(() => {
    if (workspaces?.length && !activeWorkspaceId) {
      setActiveWorkspace(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId, setActiveWorkspace]);

  const isParticipant = pathname.startsWith("/participant");
  const navItems = isParticipant ? participantNavItems : trainerNavItems;
  const hasWorkspace = !!(workspaces && workspaces.length > 0);

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
          "bg-white flex flex-col h-full flex-shrink-0 transition-all duration-300 fixed z-40 left-0 top-0 overflow-hidden whitespace-nowrap md:relative",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isDesktopSidebarOpen ? "w-[260px] md:w-[260px]" : "w-[260px] md:w-0 md:border-none"
        )}
      >

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {(hasWorkspace || isParticipant) && navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-5 pl-6 pr-4 py-2.5 rounded-r-full text-[14.5px] font-medium transition-colors duration-150 mr-4",
                  active
                    ? "bg-[#e8f0fe] text-[#1967d2]"
                    : "text-[#3c4043] hover:bg-gray-100"
                )}
              >
                <Icon
                  size={20}
                  className={active ? "text-[#1967d2]" : "text-[#5f6368]"}
                  strokeWidth={active ? 2.5 : 2}
                />
                {item.label}
              </Link>
            );
          })}

          {/* Plans link removed */}
        </nav>

        {/* Bottom */}
        <div className="py-3 border-t border-gray-100 flex-shrink-0">
          {!isPro && hasWorkspace && !isParticipant && (
            <Link
              href="/subscription"
              className="flex items-center gap-5 pl-6 pr-4 py-2.5 rounded-r-full text-[14.5px] font-medium text-[#1967d2] hover:bg-[#e8f0fe] transition-colors mr-4"
            >
              <Sparkles size={20} />
              Upgrade to Pro
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
