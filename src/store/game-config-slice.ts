import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

import { GAME_MODES } from "@/lib/game/modes";
import type {
  AdvancedRoleBucket,
  ModeConfig,
  ModeConfigField,
  TimerConfig,
} from "@/lib/types";
import {
  GameMode,
  isSimpleRoleBucket,
  RoleConfigMode,
  ShowRolesInPlay,
} from "@/lib/types";
import type { GameConfig } from "@/server/types";

import {
  defaultRoleSlotCount,
  recomputeIsValid,
  roleBucketsFromCounts,
  roleCountsFromBuckets,
} from "./game-config-helpers";
import { initialState } from "./game-config-state";

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
          .map(([roleId, count]): AdvancedRoleBucket => ({
            playerCount: count,
            roles: [{ roleId, ...(count === 1 ? { max: 1 } : {}) }],
          }));
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

export { selectRoleBuckets, selectRoleSlots } from "./game-config-selectors";
export type { GameConfigState } from "./game-config-state";

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
