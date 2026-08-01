"use client";

import { useWorkspaceStore } from "@/store/workspace";
import { useLayoutStore } from "@/store/layout";
import { useSubscriptionStore } from "@/store/subscription";
import { useAuth } from "@/hooks/useAuth";
import { Menu, User, LogOut, Crown, CreditCard, Sparkles, HelpCircle, Settings, Grid, Search } from "lucide-react";
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

  return (
    <header className="h-16 bg-white flex items-center justify-between px-4 md:px-6 border-b border-gray-300 flex-shrink-0 z-10 w-full font-sans">
      
      {/* Left Section: Menu & Logo */}
      <div className="flex items-center gap-4 min-w-[240px]">
        <button
          onClick={() => {
            toggleMobileSidebar();
            toggleDesktopSidebar();
          }}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors outline-none flex-shrink-0"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-[22px] font-normal text-gray-700 tracking-tight ml-1">
            {active?.name ?? "Workspace"}
          </span>
        </div>
      </div>

      {/* Middle Section: Search Bar (Google Drive style) */}
      <div className="hidden md:flex flex-1 max-w-[720px] mx-8">
        <div className="flex w-full items-center bg-[#f1f3f4] focus-within:bg-white focus-within:shadow-md focus-within:border-transparent border border-transparent rounded-full px-4 py-2.5 transition-all">
          <button className="text-gray-600 mr-3 flex-shrink-0">
            <Search size={20} />
          </button>
          <input 
            type="text" 
            placeholder="Search in Drive..." 
            className="w-full bg-transparent border-none outline-none text-base text-gray-700 placeholder-gray-600"
          />
        </div>
      </div>

      {/* Right Section: Tools & Profile */}
      {user && (
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          {/* Pro / Upgrade Badge */}
          {isPro ? (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
              <span className="text-[11px] font-medium text-gray-600 uppercase tracking-widest">{currentPlan?.name || 'PRO'}</span>
            </div>
          ) : (
            <Link
              href="/subscription"
              className="hidden sm:flex items-center gap-2 bg-white hover:bg-gray-50 text-[#1a73e8] border border-gray-300 px-4 py-2 rounded transition-colors"
            >
              <span className="text-sm font-medium tracking-wide">Upgrade</span>
            </Link>
          )}

          <div className="hidden sm:flex items-center gap-1 mr-2">
            {/* Help Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors outline-none" title="Support">
                  <HelpCircle size={22} strokeWidth={1.5} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 w-48 bg-white rounded shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_2px_6px_2px_rgba(60,64,67,0.15)] py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                >
                  <DropdownMenu.Item asChild>
                    <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none transition-colors">
                      Help Center
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none transition-colors">
                      Terms of Service
                    </Link>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Settings Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors outline-none" title="Settings">
                  <Settings size={22} strokeWidth={1.5} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 w-48 bg-white rounded shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_2px_6px_2px_rgba(60,64,67,0.15)] py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                >
                  <DropdownMenu.Item asChild>
                    <Link href={activeId ? `/workspaces/${activeId}/settings` : "/workspaces"} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none transition-colors">
                      Settings
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link href="/subscription" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none transition-colors">
                      Billing & Plans
                    </Link>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Google Apps Icon (Grid) */}
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors outline-none" title="OruLabs Apps">
              <Grid size={22} strokeWidth={1.5} />
            </button>
          </div>

          {/* User Profile */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="outline-none flex items-center justify-center w-8 h-8 rounded-full transition-all flex-shrink-0 bg-[#e37400] text-white hover:ring-4 hover:ring-gray-100"
                title={`Google Account\n${user.name}\n${user.email}`}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium select-none">
                    {user.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 w-[354px] bg-white rounded-[24px] shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_2px_6px_2px_rgba(60,64,67,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-2"
              >
                {/* User info (Google style large card) */}
                <div className="flex flex-col items-center pt-4 pb-2 px-4">
                  <div className="text-sm text-gray-900 font-medium mb-1">{user.email}</div>
                  
                  <div className="w-16 h-16 rounded-full bg-[#e37400] text-white flex items-center justify-center text-3xl font-normal mt-3 mb-2">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  
                  <div className="text-xl font-normal text-gray-900 mb-4 text-center">
                    Hi, {user.name?.split(' ')[0]}!
                  </div>

                  <Link
                    href="/profile"
                    className="px-6 py-2 border border-gray-300 rounded-full text-sm font-medium text-[#1a73e8] hover:bg-gray-50 transition-colors"
                  >
                    Manage your Account
                  </Link>
                </div>
                
                <div className="h-[1px] bg-gray-200 w-full my-2" />

                <div className="px-2">
                  <DropdownMenu.Item
                    onClick={signOut}
                    className="flex w-full items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 cursor-pointer outline-none transition-colors rounded-l-full rounded-r-full"
                  >
                    <LogOut size={16} />
                    Sign out
                  </DropdownMenu.Item>
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}
    </header>
  );
}
