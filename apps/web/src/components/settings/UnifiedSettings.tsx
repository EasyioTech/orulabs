"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspaceStore } from "@/store/workspace";
import { User, Settings, Sparkles, Building, LogOut, Mail, Calendar } from "lucide-react";
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

  const { register, handleSubmit, reset } = useForm<{ name: string }>({
    values: { name: workspace?.name ?? "" },
  });

  const mutation = useMutation({
    mutationFn: (data: { name: string }) =>
      apiClient.patch(`/api/workspaces/${activeWorkspaceId}`, data, {
        headers: { "X-Workspace-ID": activeWorkspaceId! },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace", activeWorkspaceId] }),
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
    <div className="max-w-6xl mx-auto py-8 px-4 h-full flex flex-col md:flex-row gap-8">
      {/* Left Sidebar (Google-like navigation) */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 px-4">Settings</h1>
        
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-full text-[14px] font-medium transition-colors text-left",
                isActive 
                  ? "bg-[#e8f0fe] text-[#1a73e8]" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon size={18} className={isActive ? "text-[#1a73e8]" : "text-gray-500"} strokeWidth={isActive ? 2.5 : 2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
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
              className="max-w-md space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Workspace Name</label>
                <input
                  {...register("name")}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                  placeholder="E.g., Acme Corp Training"
                />
              </div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-6 py-2.5 bg-[#1a73e8] text-white rounded-lg text-sm font-medium hover:bg-[#1557b0] disabled:opacity-60 transition-colors shadow-sm"
              >
                {mutation.isPending ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-6">AI Integration</h2>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-6">
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
