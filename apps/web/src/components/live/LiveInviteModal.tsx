"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { UserPlus, X, Copy, Mail, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@oruclass/utils";
import { playPop } from "@/lib/sounds";

interface LiveInviteModalProps {
  trainingId: string;
  workspaceId: string;
  joinToken: string;
}

export function LiveInviteModal({ trainingId, workspaceId, joinToken }: LiveInviteModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/join/${joinToken}` : "";

  const sendInvite = useMutation({
    mutationFn: async (emailAddr: string) => {
      return apiClient.post(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/invite-participant`,
        { email: emailAddr },
        { headers: { "X-Workspace-ID": workspaceId } }
      );
    },
    onSuccess: () => {
      setEmail("");
      setOpen(false);
      playPop();
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    playPop();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1 bg-brand-50 hover:bg-brand-100 rounded-md border border-brand-100 text-[11px] font-semibold text-brand-700 transition-colors">
          <UserPlus size={12} /> Invite
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white rounded-2xl shadow-xl z-50 animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Invite Participants</h2>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Share Join Link</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-600 focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                    copied ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400 font-medium">OR SEND EMAIL</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">Email Invitation</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && email) sendInvite.mutate(email);
                    }}
                    placeholder="participant@example.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={() => sendInvite.mutate(email)}
                  disabled={!email || sendInvite.isPending}
                  className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sendInvite.isPending ? "Sending..." : "Send"}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                They will receive a professional email with a direct link and the session code.
              </p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
