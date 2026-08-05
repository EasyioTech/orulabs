"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import type { TrainingRole } from "@oruclass/types";
import { cn } from "@oruclass/utils";
import { Users, UserPlus } from "lucide-react";
import { useWorkspaceMembers } from "@/hooks/useWorkspace";
import {
  useTraining,
  useAssignFacilitator,
  useInviteFacilitator,
  useCancelFacilitatorInvitation,
  useResendFacilitatorInvitation,
} from "@/hooks/useTrainings";
import { useStudioCan } from "./studioRole";

const FACILITATOR_ROLES: { value: TrainingRole; label: string; description: string }[] = [
  { value: "lead_trainer", label: "Lead Trainer", description: "Full control over the session" },
  { value: "full_editor", label: "Full Editor", description: "Can edit content and modules" },
  { value: "partial_editor", label: "Partial Editor", description: "Limited editing access" },
  { value: "facilitation_support", label: "Support", description: "Read-only + chat participation" },
];

export function FacilitatorPanel({ trainingId, workspaceId }: { trainingId: string; workspaceId: string }) {
  const { data: training } = useTraining(workspaceId, trainingId);
  const { data: members = [] } = useWorkspaceMembers(workspaceId);
  const assignFacilitator = useAssignFacilitator(workspaceId, trainingId);
  const inviteFacilitator = useInviteFacilitator(workspaceId, trainingId);
  const cancelInvitation = useCancelFacilitatorInvitation(workspaceId, trainingId);
  const resendInvitation = useResendFacilitatorInvitation(workspaceId, trainingId);
  const canManage = useStudioCan("assign_roles");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<TrainingRole>("full_editor");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [assignMode, setAssignMode] = useState<"member" | "email">("member");

  const allFacilitators: Array<{ userId: string; role: TrainingRole; user?: { name: string } }> =
    (training as { facilitators?: Array<{ userId: string; role: TrainingRole; user?: { name: string } }> })?.facilitators ?? [];

  // Creator is always the training owner — exclude from team list (they control the training by default)
  const facilitators = allFacilitators.filter((f) => f.userId !== training?.createdBy);

  const allInvitations = training?.pendingInvitations ?? [];
  const pendingInvitations = allInvitations.filter((inv) => (inv as { status?: string }).status === "pending");
  const resendableInvitations = allInvitations.filter((inv) => {
    const s = (inv as { status?: string }).status;
    return s === "cancelled" || s === "declined";
  });

  const unassigned = members.filter((m) => !facilitators.some((f) => f.userId === m.userId));
  const roleLabel = (role: TrainingRole) =>
    FACILITATOR_ROLES.find((r) => r.value === role)?.label ?? role;

  return (
    <div className="bg-white rounded-lg border border-[#dadce0] overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-gray-500" />
          <h2 className="text-sm font-bold text-gray-900">Training Team</h2>
          {(facilitators.length + allInvitations.length) > 0 && (
            <span className="text-[10px] font-semibold bg-[#d2e3fc] text-[#1557b0] px-1.5 py-0.5 rounded">
              {facilitators.length + allInvitations.length}
            </span>
          )}
        </div>
        {canManage && (
          <button
            onClick={() => setShowAssign((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-[#1a73e8] hover:text-brand-800 font-semibold"
          >
            <UserPlus size={12} />
            Assign
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {facilitators.length === 0 && allInvitations.length === 0 && !showAssign && (
          <div className="py-5 text-center">
            <Users size={24} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-medium">No team members assigned</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Add workspace members to help run this session</p>
          </div>
        )}

        {facilitators.map((f) => (
          <div key={f.userId} className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#d2e3fc] flex items-center justify-center text-[10px] font-bold text-[#1557b0] shrink-0">
              {(f.user?.name ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm text-gray-800 font-medium truncate flex-1 min-w-0">{f.user?.name ?? f.userId}</span>
            {canManage && f.userId !== training?.createdBy ? (
              <select
                value={f.role}
                onChange={(e) => assignFacilitator.mutate({ userId: f.userId, role: e.target.value as TrainingRole })}
                disabled={assignFacilitator.isPending}
                className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium shrink-0 border-none outline-none focus:ring-1 focus:ring-[#1a73e8] cursor-pointer disabled:opacity-50"
              >
                {FACILITATOR_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium shrink-0">
                {roleLabel(f.role)}
              </span>
            )}
          </div>
        ))}

        {pendingInvitations.map((inv) => (
          <div key={inv.id} className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700 shrink-0">
              {inv.email.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs text-gray-600 font-medium truncate">{inv.email}</span>
              <span className="text-[9px] font-semibold text-amber-600 uppercase tracking-wide">Pending</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium whitespace-nowrap">
                {roleLabel(inv.role)}
              </span>
              {canManage && (
                <button
                  onClick={() => cancelInvitation.mutate(inv.id)}
                  disabled={cancelInvitation.isPending}
                  className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Cancel invitation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {resendableInvitations.map((inv) => {
          const status = (inv as { status?: string }).status as "cancelled" | "declined";
          return (
            <div key={inv.id} className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                {inv.email.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs text-gray-500 font-medium truncate">{inv.email}</span>
                <span className={`text-[9px] font-semibold uppercase tracking-wide ${status === "declined" ? "text-red-400" : "text-gray-400"}`}>
                  {status === "declined" ? "Declined" : "Cancelled"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium whitespace-nowrap">
                  {roleLabel(inv.role)}
                </span>
                {canManage && (
                  <button
                    onClick={() => resendInvitation.mutate(inv.id)}
                    disabled={resendInvitation.isPending}
                    className="text-gray-300 hover:text-[#1a73e8] transition-colors disabled:opacity-50"
                    title="Resend invitation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.68" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {showAssign && (
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setAssignMode("member")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  assignMode === "member" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
                )}
              >
                Workspace Member
              </button>
              <button
                onClick={() => setAssignMode("email")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  assignMode === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
                )}
              >
                Invite by Email
              </button>
            </div>

            {assignMode === "member" && (
              <div className="space-y-2.5">
                {unassigned.length > 0 ? (
                  <>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-4 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
                    >
                      <option value="">Select member…</option>
                      {unassigned.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.user.name} ({m.user.email})
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as TrainingRole)}
                      className="w-full px-4 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
                    >
                      {FACILITATOR_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label} — {r.description}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAssign(false)}
                        className="flex-1 py-2 text-[#1a73e8] bg-transparent rounded-md text-xs font-medium hover:bg-blue-50/50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!selectedUserId || assignFacilitator.isPending}
                        onClick={() => {
                          assignFacilitator.mutate(
                            { userId: selectedUserId, role: selectedRole },
                            { onSuccess: () => { setSelectedUserId(""); setShowAssign(false); } },
                          );
                        }}
                        className="flex-1 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md text-xs font-medium disabled:opacity-60 transition-colors shadow-sm"
                      >
                        {assignFacilitator.isPending ? "Assigning…" : "Assign"}
                      </button>
                    </div>
                    {assignFacilitator.isError && (
                      <p className="text-xs text-red-500 mt-2 text-center">
                        {(isAxiosError(assignFacilitator.error) ? assignFacilitator.error.response?.data?.error : null) || "Failed to assign facilitator."}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-2">No unassigned workspace members.</p>
                )}
              </div>
            )}

            {assignMode === "email" && (
              <div className="space-y-2.5">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
                />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as TrainingRole)}
                  className="w-full px-4 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
                >
                  {FACILITATOR_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} — {r.description}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAssign(false)}
                    className="flex-1 py-2 text-[#1a73e8] bg-transparent rounded-md text-xs font-medium hover:bg-blue-50/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!inviteEmail || !inviteEmail.includes("@") || inviteFacilitator.isPending}
                    onClick={() => {
                      inviteFacilitator.mutate(
                        { email: inviteEmail, role: selectedRole },
                        { onSuccess: () => { setInviteEmail(""); setShowAssign(false); setSelectedRole("full_editor"); } },
                      );
                    }}
                    className="flex-1 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md text-xs font-medium disabled:opacity-60 transition-colors shadow-sm"
                  >
                    {inviteFacilitator.isPending ? "Inviting…" : "Invite"}
                  </button>
                </div>
                {inviteFacilitator.isError && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    {(isAxiosError(inviteFacilitator.error) ? inviteFacilitator.error.response?.data?.error : null) || "Failed to invite facilitator."}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
