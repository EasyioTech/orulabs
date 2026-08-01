"use client";

import { canDo } from "@/lib/permissions";
import { useLiveSessionStore } from "@/store/liveSession";
import type { TrainingRole } from "@oruclass/types";
import type { Permission } from "@oruclass/utils";

interface RoleGateProps {
  role: TrainingRole | undefined;
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ role, permission, children, fallback = null }: RoleGateProps) {
  const grantedPermissions = useLiveSessionStore((s) => s.grantedPermissions);
  const hasGrant = grantedPermissions.includes(permission as "unlock_modules" | "pause_room");
  if (!hasGrant && !canDo(role, permission)) return <>{fallback}</>;
  return <>{children}</>;
}
