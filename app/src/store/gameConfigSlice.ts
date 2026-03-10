import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { sum } from "lodash";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/models";
import type { RoleSlot } from "@/lib/models";
import type { GameConfig } from "@/server/models";
import { GAME_MODES } from "@/lib/game-modes";

function computeIsValid(
  gameMode: GameMode,
  playerCount: number,
  roleConfigMode: RoleConfigMode,
  roleCounts: Record<string, number>,
  roleMins: Record<string, number>,
  roleMaxes: Record<string, number>,
): boolean {
  if (roleConfigMode === RoleConfigMode.Default) return true;
  if (roleConfigMode === RoleConfigMode.Advanced) {
    const totalMin = sum(Object.values(roleMins));
    const totalMax = sum(Object.values(roleMaxes));
    return totalMin <= playerCount && totalMax >= playerCount;
  }
  // Custom mode
  const config = GAME_MODES[gameMode];
  if (config.isValidRoleCount) {
    return config.isValidRoleCount(playerCount, roleCounts);
  }
  return sum(Object.values(roleCounts)) === playerCount;
}

function roleCountsFromSlots(slots: RoleSlot[]): Record<string, number> {
  return Object.fromEntries(slots.map((s) => [s.roleId, s.min]));
}

function roleMinsFromSlots(slots: RoleSlot[]): Record<string, number> {
  return Object.fromEntries(slots.map((s) => [s.roleId, s.min]));
}

function roleMaxesFromSlots(slots: RoleSlot[]): Record<string, number> {
  return Object.fromEntries(slots.map((s) => [s.roleId, s.max]));
}

export interface GameConfigState {
  gameMode: GameMode;
  playerCount: number;
  roleConfigMode: RoleConfigMode;
  /** Used for Custom mode (exact counts, min === max). */
  roleCounts: Record<string, number>;
  /** Used for Advanced mode min bounds. */
  roleMins: Record<string, number>;
  /** Used for Advanced mode max bounds. */
  roleMaxes: Record<string, number>;
  showConfigToPlayers: boolean;
  showRolesInPlay: ShowRolesInPlay;
  isValid: boolean;
  /** Increments on every user-initiated action. Used to detect when a sync is needed. */
  syncVersion: number;
}

const initialState: GameConfigState = {
  gameMode: GameMode.SecretVillain,
  playerCount: 5,
  roleConfigMode: RoleConfigMode.Default,
  roleCounts: {},
  roleMins: {},
  roleMaxes: {},
  showConfigToPlayers: false,
  showRolesInPlay: ShowRolesInPlay.RoleAndCount,
  isValid: true,
  syncVersion: 0,
};

function recomputeIsValid(state: GameConfigState): boolean {
  return computeIsValid(
    state.gameMode,
    state.playerCount,
    state.roleConfigMode,
    state.roleCounts,
    state.roleMins,
    state.roleMaxes,
  );
}

const gameConfigSlice = createSlice({
  name: "gameConfig",
  initialState,
  reducers: {
    /** One-time initialisation from server config on mount. Does NOT increment syncVersion. */
    loadConfig(
      state,
      action: PayloadAction<{ config: GameConfig; playerCount: number }>,
    ) {
      const { config, playerCount } = action.payload;
      state.gameMode = config.gameMode;
      state.playerCount = playerCount;
      state.roleConfigMode = config.roleConfigMode;
      const slots = config.roleSlots ?? [];
      state.roleCounts = roleCountsFromSlots(slots);
      state.roleMins = roleMinsFromSlots(slots);
      state.roleMaxes = roleMaxesFromSlots(slots);
      state.showConfigToPlayers = config.showConfigToPlayers;
      state.showRolesInPlay = config.showRolesInPlay;
      state.isValid = recomputeIsValid(state);
    },

    setGameMode(state, action: PayloadAction<GameMode>) {
      state.gameMode = action.payload;
      const slots = GAME_MODES[action.payload].defaultRoleCount(
        state.playerCount,
      );
      state.roleCounts = roleCountsFromSlots(slots);
      state.roleMins = roleMinsFromSlots(slots);
      state.roleMaxes = roleMaxesFromSlots(slots);
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    setRoleConfigMode(state, action: PayloadAction<RoleConfigMode>) {
      const prev = state.roleConfigMode;
      state.roleConfigMode = action.payload;

      if (action.payload === RoleConfigMode.Default) {
        // Reset to game mode defaults
        const slots = GAME_MODES[state.gameMode].defaultRoleCount(
          state.playerCount,
        );
        state.roleCounts = roleCountsFromSlots(slots);
        state.roleMins = roleMinsFromSlots(slots);
        state.roleMaxes = roleMaxesFromSlots(slots);
      } else if (
        action.payload === RoleConfigMode.Advanced &&
        prev !== RoleConfigMode.Advanced
      ) {
        // Seed min/max from current counts
        state.roleMins = { ...state.roleCounts };
        state.roleMaxes = { ...state.roleCounts };
      } else if (
        action.payload === RoleConfigMode.Custom &&
        prev === RoleConfigMode.Advanced
      ) {
        // Collapse Advanced to Custom using mins
        state.roleCounts = { ...state.roleMins };
        state.roleMaxes = { ...state.roleMins };
      }

      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    incrementRoleCount(state, action: PayloadAction<string>) {
      const roleId = action.payload;
      state.roleCounts[roleId] = (state.roleCounts[roleId] ?? 0) + 1;
      state.roleMins[roleId] = state.roleCounts[roleId];
      state.roleMaxes[roleId] = state.roleCounts[roleId];
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    decrementRoleCount(state, action: PayloadAction<string>) {
      const roleId = action.payload;
      state.roleCounts[roleId] = Math.max(
        0,
        (state.roleCounts[roleId] ?? 0) - 1,
      );
      state.roleMins[roleId] = state.roleCounts[roleId];
      state.roleMaxes[roleId] = state.roleCounts[roleId];
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    setRoleCount(
      state,
      action: PayloadAction<{ roleId: string; count: number }>,
    ) {
      const { roleId, count } = action.payload;
      state.roleCounts[roleId] = Math.max(0, count);
      state.roleMins[roleId] = state.roleCounts[roleId];
      state.roleMaxes[roleId] = state.roleCounts[roleId];
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    setRoleMin(state, action: PayloadAction<{ roleId: string; min: number }>) {
      const { roleId, min } = action.payload;
      state.roleMins[roleId] = Math.max(0, min);
      // Ensure max >= min
      state.roleMaxes[roleId] = Math.max(
        state.roleMaxes[roleId] ?? 0,
        state.roleMins[roleId],
      );
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    setRoleMax(state, action: PayloadAction<{ roleId: string; max: number }>) {
      const { roleId, max } = action.payload;
      state.roleMaxes[roleId] = Math.max(0, max);
      // Ensure min <= max
      state.roleMins[roleId] = Math.min(
        state.roleMins[roleId] ?? 0,
        state.roleMaxes[roleId],
      );
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    incrementPlayerCount(state) {
      state.playerCount++;
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    decrementPlayerCount(state) {
      const { minPlayers } = GAME_MODES[state.gameMode];
      state.playerCount = Math.max(minPlayers, state.playerCount - 1);
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    setPlayerCount(state, action: PayloadAction<number>) {
      const { minPlayers } = GAME_MODES[state.gameMode];
      state.playerCount = Math.max(minPlayers, action.payload);
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    setShowConfigToPlayers(state, action: PayloadAction<boolean>) {
      state.showConfigToPlayers = action.payload;
      state.syncVersion++;
    },

    setShowRolesInPlay(state, action: PayloadAction<ShowRolesInPlay>) {
      state.showRolesInPlay = action.payload;
      state.syncVersion++;
    },
  },
});

export const {
  loadConfig,
  setGameMode,
  setRoleConfigMode,
  incrementRoleCount,
  decrementRoleCount,
  setRoleCount,
  setRoleMin,
  setRoleMax,
  incrementPlayerCount,
  decrementPlayerCount,
  setPlayerCount,
  setShowConfigToPlayers,
  setShowRolesInPlay,
} = gameConfigSlice.actions;

export default gameConfigSlice.reducer;
