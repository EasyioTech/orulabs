"use client";

import { useLiveSessionStore } from "@/store/liveSession";
import { useMyTrainingRole } from "@/hooks/useTrainings";
import { useAuthStore } from "@/store/auth";
import { useSocket } from "@/hooks/useSocket";
import { canDo } from "@/lib/permissions";
import { cn } from "@oruclass/utils";
import { Users, Unlock, PlayCircle } from "lucide-react";
import type { TrainingRole, GrantablePermission } from "@oruclass/types";

import { LiveInviteModal } from "./LiveInviteModal";

const GRANTABLE: { permission: GrantablePermission; label: string; Icon: typeof Unlock }[] = [
  { permission: "unlock_modules", label: "Slides", Icon: Unlock },
  { permission: "pause_room", label: "Session", Icon: PlayCircle },
];

export function ParticipantGrid({ trainingId, workspaceId, joinToken }: { trainingId: string; workspaceId: string; joinToken: string }) {
  const participants = useLiveSessionStore((s) => s.participants);
  const sessionGrants = useLiveSessionStore((s) => s.sessionGrants);
  const updateSessionGrant = useLiveSessionStore((s) => s.updateSessionGrant);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const myRole = useMyTrainingRole(workspaceId, trainingId);
  const socket = useSocket();

  const list = Array.from(participants.values()).filter((p) => p.connectionStatus === "online");
  const online = list.length;
  const canAssign = !myRole || canDo(myRole as TrainingRole, "assign_roles");

  function toggleGrant(targetUserId: string, permission: GrantablePermission) {
    const current = sessionGrants.get(targetUserId) ?? [];
    const granted = !current.includes(permission);
    const event = granted ? "session:grant_permission" : "session:revoke_permission";
    socket?.emit(event as any, { trainingId, targetUserId, permission });
    updateSessionGrant(targetUserId, permission, granted);
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">People</h3>
        <div className="flex items-center gap-2">
          <LiveInviteModal trainingId={trainingId} workspaceId={workspaceId} joinToken={joinToken} />
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-md border border-green-100">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-green-700">{online} Online</span>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm border border-gray-100">
            <Users size={18} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-800">No participants yet</p>
          <p className="text-xs text-gray-500 mt-0.5">They will appear here when they join.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {list.map((p) => {
            const initials = (p.name || p.userId.slice(0, 2)).slice(0, 2).toUpperCase();
            const isSelf = p.userId === currentUserId;
            const grants = sessionGrants.get(p.userId) ?? [];
            const isCoTrainer = p.role === "trainer" && !isSelf;

            return (
              <div
                key={p.userId}
                className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-700">
                      {initials}
                    </div>
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white",
                        p.connectionStatus === "online" ? "bg-green-500" : "bg-gray-300",
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate font-medium">
                      {p.name || `User ${p.userId.slice(0, 6)}`}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      Joined at {new Date(p.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {p.role === "trainer" && (
                    <span className="text-[10px] bg-brand-600 text-white border border-brand-600 px-1.5 py-0.5 rounded-md font-medium flex-shrink-0">
                      Trainer
                    </span>
                  )}
                </div>

                {/* Grant controls — only shown to assign_roles users for other trainers */}
                {canAssign && isCoTrainer && (
                  <div className="flex items-center gap-1.5 pl-11">
                    {GRANTABLE.map(({ permission, label, Icon }) => {
                      const active = grants.includes(permission);
                      return (
                        <button
                          key={permission}
                          onClick={() => toggleGrant(p.userId, permission)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-semibold transition-colors border",
                            active
                              ? "bg-brand-600 text-white border-brand-600"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:border-brand-300 hover:text-brand-600",
                          )}
                        >
                          <Icon size={10} strokeWidth={2.5} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
