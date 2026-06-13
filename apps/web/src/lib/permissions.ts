import { hasPermission, type Permission } from "@oruclass/utils";
import type { TrainingRole } from "@oruclass/types";

export { hasPermission };

export function canDo(role: TrainingRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return hasPermission(role, permission);
}
