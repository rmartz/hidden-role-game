import { createSlice, createSelector } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { sum } from "lodash";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import type {
  ModeConfig,
  ModeConfigField,
  RoleBucket,
  RoleBucketSlot,
  TimerConfig,
} from "@/lib/types";
import type { GameConfig } from "@/server/types";
import { DEFAULT_GAME_MODE, GAME_MODES } from "@/lib/game/modes";

function computeIsValid(
  gameMode: GameMode,
  playerCount: number,
  roleConfigMode: RoleConfigMode,
  roleCounts: Record<string, number>,
  roleBuckets: RoleBucket[],
  modeConfig: ModeConfig,
): boolean {
  if (roleConfigMode === RoleConfigMode.Default) {
    return playerCount >= GAME_MODES[gameMode].minPlayers;
  }
  if (roleConfigMode === RoleConfigMode.Advanced) {
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

function roleCountsFromBuckets(buckets: RoleBucket[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const bucket of buckets) {
    const firstRole = bucket.roles[0];
    if (bucket.roles.length === 1 && firstRole) {
      // single-role bucket = Default/Custom representation
      counts[firstRole.roleId] =
        (counts[firstRole.roleId] ?? 0) + bucket.playerCount;
    }
  }
  return counts;
}

function roleBucketsFromCounts(
  roleCounts: Record<string, number>,
): RoleBucket[] {
  return Object.entries(roleCounts)
    .filter(([, count]) => count > 0)
    .map(([roleId, count]) => ({
      playerCount: count,
      roles: [{ roleId, min: 1 }],
    }));
}

export interface GameConfigState {
  gameMode: GameMode;
  playerCount: number;
  roleConfigMode: RoleConfigMode;
  /** Used for Custom mode (exact counts, min === max). */
  roleCounts: Record<string, number>;
  /** Used for Default/Custom/Advanced modes. */
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
      const buckets =
        config.roleBuckets.length > 0
          ? config.roleBuckets
          : GAME_MODES[config.gameMode].defaultRoleCount(playerCount);
      state.roleCounts = roleCountsFromBuckets(buckets);
      state.roleBuckets = buckets;
      state.showConfigToPlayers = config.showConfigToPlayers;
      state.showRolesInPlay = config.showRolesInPlay;
      state.timerConfig = config.timerConfig;
      state.modeConfig = config.modeConfig;
      state.isValid = recomputeIsValid(state);
    },

    setGameMode(state, action: PayloadAction<GameMode>) {
      state.gameMode = action.payload;
      const modeConfig = GAME_MODES[action.payload];
      const buckets = modeConfig.defaultRoleCount(state.playerCount);
      state.roleCounts = roleCountsFromBuckets(buckets);
      state.roleBuckets = buckets;
      state.timerConfig = modeConfig.defaultTimerConfig;
      state.modeConfig = modeConfig.defaultModeConfig;
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    setRoleConfigMode(state, action: PayloadAction<RoleConfigMode>) {
      state.roleConfigMode = action.payload;

      if (action.payload === RoleConfigMode.Default) {
        // Reset to game mode defaults
        const buckets = GAME_MODES[state.gameMode].defaultRoleCount(
          state.playerCount,
        );
        state.roleCounts = roleCountsFromBuckets(buckets);
        state.roleBuckets = buckets;
      } else if (action.payload === RoleConfigMode.Advanced) {
        // Start with an empty bucket — user builds from scratch
        state.roleBuckets = [];
      } else {
        // Custom — sync buckets from current counts
        state.roleBuckets = roleBucketsFromCounts(state.roleCounts);
      }

      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    incrementRoleCount(state, action: PayloadAction<string>) {
      const roleId = action.payload;
      state.roleCounts[roleId] = (state.roleCounts[roleId] ?? 0) + 1;
      state.roleBuckets = roleBucketsFromCounts(state.roleCounts);
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    decrementRoleCount(state, action: PayloadAction<string>) {
      const roleId = action.payload;
      state.roleCounts[roleId] = Math.max(
        0,
        (state.roleCounts[roleId] ?? 0) - 1,
      );
      state.roleBuckets = roleBucketsFromCounts(state.roleCounts);
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    setRoleCount(
      state,
      action: PayloadAction<{ roleId: string; count: number }>,
    ) {
      const { roleId, count } = action.payload;
      state.roleCounts[roleId] = Math.max(0, count);
      state.roleBuckets = roleBucketsFromCounts(state.roleCounts);
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
        const buckets = modeDefinition.defaultRoleCount(effectiveCount);
        state.roleCounts = roleCountsFromBuckets(buckets);
        state.roleBuckets = buckets;
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
        const buckets = modeDefinition.defaultRoleCount(effectiveCount);
        state.roleCounts = roleCountsFromBuckets(buckets);
        state.roleBuckets = buckets;
      }
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },
  },
});

export const selectRoleBuckets = (state: GameConfigState): RoleBucket[] =>
  state.roleBuckets;

// Kept for backward compat with any callers that still reference it — returns empty array now.
export const selectRoleSlots = createSelector(
  (state: GameConfigState) => state.roleBuckets,
  (): never[] => [],
);

export const {
  loadConfig,
  setGameMode,
  setRoleConfigMode,
  incrementRoleCount,
  decrementRoleCount,
  setRoleCount,
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
