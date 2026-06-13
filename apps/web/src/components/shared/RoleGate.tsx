"use client";

import { canDo } from "@/lib/permissions";
import type { TrainingRole } from "@oruclass/types";
import type { Permission } from "@oruclass/utils";

interface RoleGateProps {
  role: TrainingRole | undefined;
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ role, permission, children, fallback = null }: RoleGateProps) {
  if (!canDo(role, permission)) return <>{fallback}</>;
  return <>{children}</>;
}
