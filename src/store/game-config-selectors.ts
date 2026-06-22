import { createSelector } from "@reduxjs/toolkit";

import type { RoleBucket } from "@/lib/types";

import type { GameConfigState } from "./game-config-state";

export const selectRoleBuckets = (state: GameConfigState): RoleBucket[] =>
  state.roleBuckets;

// Kept for backward compat with any callers that still reference it — returns empty array now.
export const selectRoleSlots = createSelector(
  (state: GameConfigState) => state.roleBuckets,
  (): never[] => [],
);
