import { createSlice, createSelector } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { sum } from "lodash";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import type {
  ModeConfig,
  ModeConfigField,
  RoleBucket,
  RoleBucketSlot,
  RoleSlot,
  TimerConfig,
} from "@/lib/types";
import type { GameConfig } from "@/server/types";
import { DEFAULT_GAME_MODE, GAME_MODES } from "@/lib/game/modes";

function computeIsValid(
  gameMode: GameMode,
  playerCount: number,
  roleConfigMode: RoleConfigMode,
  roleCounts: Record<string, number>,
  roleMins: Record<string, number>,
  roleMaxes: Record<string, number>,
  roleBuckets: RoleBucket[],
  modeConfig: ModeConfig,
): boolean {
  if (roleConfigMode === RoleConfigMode.Default) {
    return playerCount >= GAME_MODES[gameMode].minPlayers;
  }
  if (roleConfigMode === RoleConfigMode.Advanced) {
    const totalMin = sum(Object.values(roleMins));
    const totalMax = sum(Object.values(roleMaxes));
    return totalMin <= playerCount && totalMax >= playerCount;
  }
  if (roleConfigMode === RoleConfigMode.Buckets) {
    if (roleBuckets.length === 0) return false;
    const totalPlayerCount = sum(roleBuckets.map((b) => b.playerCount));
    const modeDefinition = GAME_MODES[gameMode];
    const required =
      modeDefinition.resolveRoleSlotsRequired?.(playerCount, modeConfig) ??
      modeDefinition.roleSlotsRequired?.(playerCount) ??
      playerCount;
    return totalPlayerCount === required;
  }
  // Custom mode
  const config = GAME_MODES[gameMode];
  if (config.resolveIsValidRoleCount) {
    return config.resolveIsValidRoleCount(playerCount, roleCounts, modeConfig);
  }
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
  /** Used for Buckets mode. */
  roleBuckets: RoleBucket[];
  showConfigToPlayers: boolean;
  showRolesInPlay: ShowRolesInPlay;
  timerConfig: TimerConfig;
  /** Game-mode-specific configuration. Discriminated by `modeConfig.gameMode`. */
  modeConfig: ModeConfig;
  isValid: boolean;
  /** Increments on every user-initiated action. Used to detect when a sync is needed. */
  syncVersion: number;
}

const defaultMode = DEFAULT_GAME_MODE;

const initialState: GameConfigState = {
  gameMode: defaultMode,
  playerCount: 5,
  roleConfigMode: RoleConfigMode.Default,
  roleCounts: {},
  roleMins: {},
  roleMaxes: {},
  roleBuckets: [],
  showConfigToPlayers: false,
  showRolesInPlay: ShowRolesInPlay.None,
  timerConfig: GAME_MODES[defaultMode].defaultTimerConfig,
  modeConfig: GAME_MODES[defaultMode].defaultModeConfig,
  isValid: false,
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
    state.roleBuckets,
    state.modeConfig,
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
      const slots =
        config.roleSlots && config.roleSlots.length > 0
          ? config.roleSlots
          : GAME_MODES[config.gameMode].defaultRoleCount(playerCount);
      state.roleCounts = roleCountsFromSlots(slots);
      state.roleMins = roleMinsFromSlots(slots);
      state.roleMaxes = roleMaxesFromSlots(slots);
      state.roleBuckets = config.roleBuckets ?? [];
      state.showConfigToPlayers = config.showConfigToPlayers;
      state.showRolesInPlay = config.showRolesInPlay;
      state.timerConfig = config.timerConfig;
      state.modeConfig = config.modeConfig;
      state.isValid = recomputeIsValid(state);
    },

    setGameMode(state, action: PayloadAction<GameMode>) {
      state.gameMode = action.payload;
      const modeConfig = GAME_MODES[action.payload];
      const slots = modeConfig.defaultRoleCount(state.playerCount);
      state.roleCounts = roleCountsFromSlots(slots);
      state.roleMins = roleMinsFromSlots(slots);
      state.roleMaxes = roleMaxesFromSlots(slots);
      state.roleBuckets = [];
      state.timerConfig = modeConfig.defaultTimerConfig;
      state.modeConfig = modeConfig.defaultModeConfig;
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
        state.roleBuckets = [];
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
      } else if (action.payload === RoleConfigMode.Buckets) {
        // Start with an empty bucket — user builds from scratch
        state.roleBuckets = [];
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

    addBucket(state) {
      state.roleBuckets.push({ playerCount: 1, roles: [] });
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    removeBucket(state, action: PayloadAction<number>) {
      state.roleBuckets.splice(action.payload, 1);
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    setBucketPlayerCount(
      state,
      action: PayloadAction<{ bucketIndex: number; playerCount: number }>,
    ) {
      const bucket = state.roleBuckets[action.payload.bucketIndex];
      if (bucket) {
        bucket.playerCount = Math.max(1, action.payload.playerCount);
        state.isValid = recomputeIsValid(state);
        state.syncVersion++;
      }
    },

    addRoleToBucket(
      state,
      action: PayloadAction<{ bucketIndex: number; roleId: string }>,
    ) {
      const bucket = state.roleBuckets[action.payload.bucketIndex];
      if (
        bucket &&
        !bucket.roles.some((r) => r.roleId === action.payload.roleId)
      ) {
        bucket.roles.push({ roleId: action.payload.roleId, min: 0, max: 1 });
        state.isValid = recomputeIsValid(state);
        state.syncVersion++;
      }
    },

    removeRoleFromBucket(
      state,
      action: PayloadAction<{ bucketIndex: number; roleId: string }>,
    ) {
      const bucket = state.roleBuckets[action.payload.bucketIndex];
      if (bucket) {
        bucket.roles = bucket.roles.filter(
          (r) => r.roleId !== action.payload.roleId,
        );
        state.isValid = recomputeIsValid(state);
        state.syncVersion++;
      }
    },

    setBucketRoleUnique(
      state,
      action: PayloadAction<{
        bucketIndex: number;
        roleId: string;
        unique: boolean;
      }>,
    ) {
      const bucket = state.roleBuckets[action.payload.bucketIndex];
      const slot = bucket?.roles.find(
        (r) => r.roleId === action.payload.roleId,
      );
      if (slot) {
        const slotTyped = slot as RoleBucketSlot;
        if (action.payload.unique) {
          slotTyped.max = 1;
        } else {
          delete slotTyped.max;
        }
        state.isValid = recomputeIsValid(state);
        state.syncVersion++;
      }
    },

    setBucketRoleMin(
      state,
      action: PayloadAction<{
        bucketIndex: number;
        roleId: string;
        min: number;
      }>,
    ) {
      const bucket = state.roleBuckets[action.payload.bucketIndex];
      const slot = bucket?.roles.find(
        (r) => r.roleId === action.payload.roleId,
      );
      if (slot) {
        slot.min = Math.max(0, action.payload.min);
        state.isValid = recomputeIsValid(state);
        state.syncVersion++;
      }
    },

    setPlayerCount(state, action: PayloadAction<number>) {
      state.playerCount = Math.max(1, action.payload);
      if (state.roleConfigMode === RoleConfigMode.Default) {
        const modeDefinition = GAME_MODES[state.gameMode];
        const effectiveCount =
          modeDefinition.resolveRoleSlotsRequired?.(
            state.playerCount,
            state.modeConfig,
          ) ?? state.playerCount;
        const slots = modeDefinition.defaultRoleCount(effectiveCount);
        state.roleCounts = roleCountsFromSlots(slots);
        state.roleMins = roleMinsFromSlots(slots);
        state.roleMaxes = roleMaxesFromSlots(slots);
      }
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

    setTimerConfig(state, action: PayloadAction<TimerConfig>) {
      state.timerConfig = action.payload;
      state.syncVersion++;
    },

    setModeConfig(state, action: PayloadAction<ModeConfig>) {
      state.modeConfig = action.payload;
      state.syncVersion++;
    },

    updateModeConfigField(
      state,
      action: PayloadAction<{ key: ModeConfigField; value: unknown }>,
    ) {
      state.modeConfig = {
        ...state.modeConfig,
        [action.payload.key]: action.payload.value,
      } as ModeConfig;
      if (state.roleConfigMode === RoleConfigMode.Default) {
        const modeDefinition = GAME_MODES[state.gameMode];
        const effectiveCount =
          modeDefinition.resolveRoleSlotsRequired?.(
            state.playerCount,
            state.modeConfig,
          ) ?? state.playerCount;
        const slots = modeDefinition.defaultRoleCount(effectiveCount);
        state.roleCounts = roleCountsFromSlots(slots);
        state.roleMins = roleMinsFromSlots(slots);
        state.roleMaxes = roleMaxesFromSlots(slots);
      }
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },
  },
});

export const selectRoleSlots = createSelector(
  (state: GameConfigState) => state.roleConfigMode,
  (state: GameConfigState) => state.roleCounts,
  (state: GameConfigState) => state.roleMins,
  (state: GameConfigState) => state.roleMaxes,
  (roleConfigMode, roleCounts, roleMins, roleMaxes): RoleSlot[] => {
    if (roleConfigMode === RoleConfigMode.Advanced) {
      return Object.keys(roleMins)
        .filter((id) => (roleMaxes[id] ?? 0) > 0)
        .map((id) => ({
          roleId: id,
          min: roleMins[id] ?? 0,
          max: roleMaxes[id] ?? 0,
        }));
    }
    // Buckets mode: flat slots are not meaningful — return empty; use selectRoleBuckets instead.
    if (roleConfigMode === RoleConfigMode.Buckets) return [];
    return Object.entries(roleCounts)
      .filter(([, count]) => count > 0)
      .map(([roleId, count]) => ({ roleId, min: count, max: count }));
  },
);

export const selectRoleBuckets = (state: GameConfigState): RoleBucket[] =>
  state.roleBuckets;

export const {
  loadConfig,
  setGameMode,
  setRoleConfigMode,
  incrementRoleCount,
  decrementRoleCount,
  setRoleCount,
  setRoleMin,
  setRoleMax,
  addBucket,
  removeBucket,
  setBucketPlayerCount,
  addRoleToBucket,
  removeRoleFromBucket,
  setBucketRoleUnique,
  setBucketRoleMin,
  setPlayerCount,
  setShowConfigToPlayers,
  setShowRolesInPlay,
  setTimerConfig,
  setModeConfig,
  updateModeConfigField,
} = gameConfigSlice.actions;

export default gameConfigSlice.reducer;
