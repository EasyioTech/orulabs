"use client";

import { useWorkspaceStore } from "@/store/workspace";
import { useLayoutStore } from "@/store/layout";
import { useSubscriptionStore } from "@/store/subscription";
import { useAuth } from "@/hooks/useAuth";
import { Menu, User, LogOut, Crown, CreditCard, Sparkles, HelpCircle, MessageSquare, Settings, Grid, GraduationCap } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { getPlan } from "@/config/plans";
import { cn } from "@oruclass/utils";
import { useState, useEffect } from "react";

import { Logo } from "@/components/shared/Logo";

export function Header() {
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const active = workspaces.find((w) => w.id === activeId);

  const { user, signOut } = useAuth();
  const toggleMobileSidebar = useLayoutStore((s) => s.toggleMobileSidebar);
  const toggleDesktopSidebar = useLayoutStore((s) => s.toggleDesktopSidebar);

  const { planId, status } = useSubscriptionStore();
  const isPro = status === "active";
  const currentPlan = planId ? getPlan(planId) : null;

  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      setTimeString(`${time} • ${date}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10 w-full">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            toggleMobileSidebar();
            toggleDesktopSidebar();
          }}
          className="p-2.5 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors outline-none"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="text-[22px] font-medium text-gray-600 tracking-tight ml-1">
            {active?.name ?? "OruLabs"}
          </span>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center text-[15px] text-gray-600 font-medium mr-4">
            {timeString}
          </div>

          <div className="hidden sm:flex items-center gap-1 mr-2">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition-colors outline-none">
                  <HelpCircle size={22} strokeWidth={1.5} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                >
                  <DropdownMenu.Item asChild>
                    <Link href="#" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer outline-none transition-colors">
                      Help Center
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link href="#" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer outline-none transition-colors">
                      Terms of Service
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link href="#" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer outline-none transition-colors">
                      Privacy Policy
                    </Link>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition-colors outline-none">
                  <Settings size={22} strokeWidth={1.5} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                >
                  <DropdownMenu.Item asChild>
                    <Link href="/workspaces" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer outline-none transition-colors">
                      Workspace Settings
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link href="/subscription" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer outline-none transition-colors">
                      Billing & Plans
                    </Link>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* Subscription CTA / PRO Badge */}
          {isPro ? (
            <div className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-2.5 py-1 rounded-full mr-2">
              <Crown size={12} className="text-amber-500" strokeWidth={2.5} />
              <span className="text-[11px] font-700 text-amber-700 tracking-wide">PRO</span>
            </div>
          ) : (
            <Link
              href="/subscription"
              className="hidden sm:flex items-center gap-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white px-4 py-2 rounded-full mr-2 transition-colors shadow-sm"
            >
              <Sparkles size={16} className="text-white" strokeWidth={2} />
              <span className="text-[13px] font-medium tracking-wide">Upgrade Plan</span>
            </Link>
          )}

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className={cn(
                  "outline-none flex items-center justify-center w-8 h-8 rounded-full transition-all flex-shrink-0",
                  isPro
                    ? "bg-gradient-to-br from-amber-100 to-orange-100 ring-2 ring-amber-300/50 hover:ring-amber-400/70"
                    : "bg-brand-100 hover:ring-2 hover:ring-brand-500/20"
                )}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span
                    className={cn(
                      "text-[12px] font-bold select-none",
                      isPro ? "text-amber-700" : "text-brand-600"
                    )}
                  >
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
              >
                {/* User info + plan badge */}
                <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.name}
                    </p>
                    {isPro && currentPlan && (
                      <span className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-700 px-2 py-0.5 rounded-full shadow-sm">
                        <Sparkles size={9} />
                        {currentPlan.name.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {user.email}
                  </p>
                  {!isPro && (
                    <Link
                      href="/subscription"
                      className="mt-2 flex items-center gap-1.5 text-[11.5px] font-600 text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      <Crown size={12} />
                      Upgrade to Pro
                    </Link>
                  )}
                </div>

                <DropdownMenu.Item asChild>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer outline-none transition-colors"
                  >
                    <User size={15} className="text-gray-400" />
                    My Profile
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    href={isPro ? "/subscription/billing" : "/subscription"}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer outline-none transition-colors"
                  >
                    <CreditCard size={15} className="text-gray-400" />
                    {isPro ? "Manage Plan" : "View Plans"}
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-[1px] bg-gray-100 my-1" />

                <DropdownMenu.Item
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none transition-colors"
                >
                  <LogOut size={15} />
                  Sign Out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}
    </header>
  );
}
