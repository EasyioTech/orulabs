import type { TrainingRole } from "@oruclass/types";

// Granular capabilities. edit_modules = create/edit/delete/reorder modules &
// their config; edit_agenda = day structure + training info; the rest are
// session-control / data / management actions.
export type Permission =
  | "unlock_modules"
  | "edit_modules"
  | "edit_agenda"
  | "pause_room"
  | "export_data"
  | "assign_roles"
  | "view_data"
  | "invite_participants";

// Roles map 1:1 to the studio UI labels:
//   lead_trainer        → Lead Trainer · full control
//   full_editor         → Full Editor · edit content + modules + run the room
//   partial_editor      → Partial Editor · edit module content only (no agenda/room/mgmt)
//   facilitation_support→ Support · read-only + chat participation
export const ROLE_PERMISSIONS: Record<TrainingRole, Permission[]> = {
  lead_trainer: [
    "unlock_modules",
    "edit_modules",
    "edit_agenda",
    "pause_room",
    "export_data",
    "assign_roles",
    "view_data",
    "invite_participants",
  ],
  full_editor: [
    "unlock_modules",
    "edit_modules",
    "edit_agenda",
    "pause_room",
    "view_data",
    "invite_participants",
  ],
  partial_editor: ["edit_modules", "view_data"],
  facilitation_support: ["view_data"],
};

export function hasPermission(role: TrainingRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: TrainingRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
