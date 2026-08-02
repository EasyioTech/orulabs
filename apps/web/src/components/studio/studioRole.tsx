"use client";

import { createContext, useContext } from "react";
import type { TrainingRole } from "@oruclass/types";
import { canDo } from "@/lib/permissions";
import type { Permission } from "@oruclass/utils";

// Current user's training role, provided once at StudioPage root so deeply nested
// cards/panels can gate mutating controls without prop-drilling. `undefined` =
// not a facilitator (participant / still loading) → no edit rights.
export const StudioRoleContext = createContext<TrainingRole | undefined>(undefined);

export function useStudioRole(): TrainingRole | undefined {
  return useContext(StudioRoleContext);
}

export function useStudioCan(permission: Permission): boolean {
  return canDo(useStudioRole(), permission);
}
