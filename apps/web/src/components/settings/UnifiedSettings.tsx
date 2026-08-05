"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspaceStore } from "@/store/workspace";
import { User, Settings, Sparkles, Building, LogOut, Mail, Calendar, Check, Save } from "lucide-react";
import { format } from "date-fns";
import { AIDataAnalysisTab } from "@/components/ai-integration/AIDataAnalysisTab";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { cn } from "@oruclass/utils";
import * as Tabs from "@radix-ui/react-tabs";

export function UnifiedSettings() {
  const { user, signOut } = useAuth();
  const { activeWorkspaceId } = useWorkspaceStore();
  const { data: workspace } = useWorkspace(activeWorkspaceId ?? "");
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { register, handleSubmit, reset } = useForm<{ name: string; enableRaiseHand: boolean; enableChat: boolean }>({
    values: { 
      name: workspace?.name ?? "",
      enableRaiseHand: workspace?.settings?.enableRaiseHand ?? true,
      enableChat: workspace?.settings?.enableChat ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: { name: string; enableRaiseHand: boolean; enableChat: boolean }) =>
      apiClient.patch(`/api/workspaces/${activeWorkspaceId}`, {
        name: data.name,
        settings: { ...workspace?.settings, enableRaiseHand: data.enableRaiseHand, enableChat: data.enableChat }
      }, {
        headers: { "X-Workspace-ID": activeWorkspaceId! },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace", activeWorkspaceId] });
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    },
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-600 rounded-full animate-spin"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "workspace", label: "Workspace", icon: Building },
    { id: "ai", label: "AI Integration", icon: Sparkles },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 font-sans">
      {/* Top Header & Navigation Tabs */}
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-gray-900 mb-6 px-1 tracking-tight">Settings</h1>
        
        <div className="flex items-center gap-2 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-[14px] font-medium transition-colors border-b-2 relative -mb-[1px]",
                  isActive 
                    ? "text-[#1a73e8] border-[#1a73e8]" 
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50 rounded-t-lg"
                )}
              >
                <Icon size={18} className={isActive ? "text-[#1a73e8]" : "text-gray-500"} strokeWidth={isActive ? 2 : 1.5} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        {activeTab === "profile" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header Cover */}
            <div className="h-32 bg-gradient-to-r from-brand-600 to-brand-800"></div>
            
            <div className="px-8 pb-8">
              {/* Avatar Area */}
              <div className="relative flex justify-between items-end -mt-12 mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-brand-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-brand-600">
                      {user.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>

              {/* User Details */}
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-500 flex items-center gap-2 mt-1 mb-8">
                  <Mail size={16} className="text-gray-400" />
                  {user.email}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[13px] font-semibold text-gray-500 flex items-center gap-2 mb-2 uppercase tracking-wider">
                      <User size={14} />
                      Account ID
                    </p>
                    <p className="text-[15px] text-gray-900 font-mono">
                      {user.id}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[13px] font-semibold text-gray-500 flex items-center gap-2 mb-2 uppercase tracking-wider">
                      <Calendar size={14} />
                      Joined Date
                    </p>
                    <p className="text-[15px] text-gray-900">
                      {user.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy") : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "workspace" && (
          <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Workspace Settings</h2>
            <form
              onSubmit={handleSubmit((d) => mutation.mutate(d))}
              className="max-w-xl space-y-8"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Workspace Name</label>
                  <input
                    {...register("name")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent transition-all"
                    placeholder="E.g., Acme Corp Training"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">This name will be visible to all members of the workspace.</p>
                </div>

                <div className="pt-5 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Meeting Features</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("enableRaiseHand")}
                        className="w-4 h-4 text-[#1a73e8] border-gray-300 rounded focus:ring-[#1a73e8] cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">Enable Raise Hand</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register("enableChat")}
                        className="w-4 h-4 text-[#1a73e8] border-gray-300 rounded focus:ring-[#1a73e8] cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">Enable Live Chat</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded text-sm font-medium transition-colors",
                    saveSuccess 
                      ? "bg-green-600 text-white hover:bg-green-700" 
                      : "bg-[#1a73e8] text-white hover:bg-[#1557b0] disabled:opacity-60"
                  )}
                >
                  {mutation.isPending ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : saveSuccess ? (
                    <><Check size={16} strokeWidth={2.5} /> Saved Successfully</>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              {activeWorkspaceId ? (
                <AIDataAnalysisTab workspaceId={activeWorkspaceId} />
              ) : (
                <p className="text-gray-500 text-sm">No active workspace selected.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
