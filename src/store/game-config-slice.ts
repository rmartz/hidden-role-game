import { createSlice, createSelector } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { sum } from "lodash";
import {
  GameMode,
  RoleConfigMode,
  ShowRolesInPlay,
  isSimpleRoleBucket,
} from "@/lib/types";
import type {
  AdvancedRoleBucket,
  ModeConfig,
  ModeConfigField,
  RoleBucket,
  SimpleRoleBucket,
  TimerConfig,
} from "@/lib/types";
import type { GameConfig } from "@/server/types";
import {
  DEFAULT_GAME_MODE,
  GAME_MODES,
  getAdvancedBucketMaxCapacity,
} from "@/lib/game/modes";

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
    if (totalPlayerCount !== required) return false;
    // Each advanced bucket must have enough draw capacity to fill its playerCount.
    for (const bucket of roleBuckets) {
      if (isSimpleRoleBucket(bucket)) continue;
      if (getAdvancedBucketMaxCapacity(bucket) < bucket.playerCount)
        return false;
    }
    return true;
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

/**
 * Returns the number of role slots to pass to `defaultRoleCount` for a given
 * player count and mode config. Accounts for modes that reserve players as
 * non-role owners (e.g. Werewolf Narrator) and for hidden unassigned roles.
 */
function defaultRoleSlotCount(
  gameMode: GameMode,
  playerCount: number,
  modeConfig: ModeConfig,
): number {
  const modeDefinition = GAME_MODES[gameMode];
  return (
    modeDefinition.resolveRoleSlotsRequired?.(playerCount, modeConfig) ??
    modeDefinition.roleSlotsRequired?.(playerCount) ??
    playerCount
  );
}

function roleCountsFromBuckets(buckets: RoleBucket[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const bucket of buckets) {
    if (isSimpleRoleBucket(bucket)) {
      counts[bucket.roleId] = (counts[bucket.roleId] ?? 0) + bucket.playerCount;
    }
    // Advanced multi-role buckets don't map to a simple per-role count
  }
  return counts;
}

function roleBucketsFromCounts(
  roleCounts: Record<string, number>,
): SimpleRoleBucket[] {
  return Object.entries(roleCounts)
    .filter(([, count]) => count > 0)
    .map(([roleId, count]) => ({ playerCount: count, roleId }));
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
          : GAME_MODES[config.gameMode].defaultRoleCount(
              defaultRoleSlotCount(
                config.gameMode,
                playerCount,
                config.modeConfig,
              ),
            );
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
      const modeDefinition = GAME_MODES[action.payload];
      const newModeConfig = modeDefinition.defaultModeConfig;
      const buckets = modeDefinition.defaultRoleCount(
        defaultRoleSlotCount(action.payload, state.playerCount, newModeConfig),
      );
      state.roleCounts = roleCountsFromBuckets(buckets);
      state.roleBuckets = buckets;
      state.timerConfig = modeDefinition.defaultTimerConfig;
      state.modeConfig = newModeConfig;
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    setRoleConfigMode(state, action: PayloadAction<RoleConfigMode>) {
      state.roleConfigMode = action.payload;

      if (action.payload === RoleConfigMode.Default) {
        // Reset to game mode defaults
        const buckets = GAME_MODES[state.gameMode].defaultRoleCount(
          defaultRoleSlotCount(
            state.gameMode,
            state.playerCount,
            state.modeConfig,
          ),
        );
        state.roleCounts = roleCountsFromBuckets(buckets);
        state.roleBuckets = buckets;
      } else if (action.payload === RoleConfigMode.Advanced) {
        // Pre-populate from current role counts — one bucket per role type
        state.roleBuckets = Object.entries(state.roleCounts)
          .filter(([, count]) => count > 0)
          .map(
            ([roleId, count]): AdvancedRoleBucket => ({
              playerCount: count,
              roles: [{ roleId, ...(count === 1 ? { max: 1 } : {}) }],
            }),
          );
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

    setBucketName(
      state,
      action: PayloadAction<{ bucketIndex: number; name: string }>,
    ) {
      const bucket = state.roleBuckets[action.payload.bucketIndex];
      if (bucket && !isSimpleRoleBucket(bucket)) {
        bucket.name = action.payload.name || undefined;
        state.syncVersion++;
      }
    },

    addRoleToBucket(
      state,
      action: PayloadAction<{
        bucketIndex: number;
        roleId: string;
        /** True if the bucket is currently in all-unique mode — cap this slot too. */
        bucketIsUnique?: boolean;
      }>,
    ) {
      const bucket = state.roleBuckets[action.payload.bucketIndex];
      if (!bucket || isSimpleRoleBucket(bucket)) return;
      if (!bucket.roles.some((r) => r.roleId === action.payload.roleId)) {
        const roleDef = GAME_MODES[state.gameMode].roles[action.payload.roleId];
        const isInherentlyUnique = roleDef?.unique === true;
        const shouldCap =
          isInherentlyUnique || action.payload.bucketIsUnique === true;
        bucket.roles.push({
          roleId: action.payload.roleId,
          ...(shouldCap ? { max: 1 } : {}),
        });
        state.isValid = recomputeIsValid(state);
        state.syncVersion++;
      }
    },

    removeRoleFromBucket(
      state,
      action: PayloadAction<{ bucketIndex: number; roleId: string }>,
    ) {
      const bucket = state.roleBuckets[action.payload.bucketIndex];
      if (!bucket || isSimpleRoleBucket(bucket)) return;
      bucket.roles = bucket.roles.filter(
        (r) => r.roleId !== action.payload.roleId,
      );
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
    },

    setBucketUnique(
      state,
      action: PayloadAction<{
        bucketIndex: number;
        unique: boolean;
      }>,
    ) {
      const bucket = state.roleBuckets[action.payload.bucketIndex];
      if (!bucket || isSimpleRoleBucket(bucket)) return;
      const modeRoles = GAME_MODES[state.gameMode].roles;
      for (const slot of bucket.roles) {
        // Inherently unique roles are always capped at 1 — skip the toggle logic.
        if (modeRoles[slot.roleId]?.unique === true) {
          slot.max = 1;
          continue;
        }
        if (action.payload.unique) {
          slot.max = 1;
        } else if (slot.max === 1) {
          delete slot.max;
        }
      }
      state.isValid = recomputeIsValid(state);
      state.syncVersion++;
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
      };
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
  setBucketName,
  addRoleToBucket,
  removeRoleFromBucket,
  setBucketUnique,
  setPlayerCount,
  setShowConfigToPlayers,
  setShowRolesInPlay,
  setTimerConfig,
  setModeConfig,
  updateModeConfigField,
} = gameConfigSlice.actions;

export default gameConfigSlice.reducer;
