import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { keyBy, mapValues, sum } from "lodash";
import { GameMode } from "@/lib/models";
import type { RoleSlot } from "@/lib/models";
import type { GameConfig } from "@/server/models";
import { GAME_MODES } from "@/lib/game-modes";

function computeIsValid(
  gameMode: GameMode,
  playerCount: number,
  roleCounts: Record<string, number>,
): boolean {
  const config = GAME_MODES[gameMode];
  if (config.isValidRoleCount) {
    return config.isValidRoleCount(playerCount, roleCounts);
  }
  return sum(Object.values(roleCounts)) === playerCount;
}

function roleCountsFromSlots(slots: RoleSlot[]): Record<string, number> {
  return mapValues(keyBy(slots, "roleId"), "count");
}

export interface GameConfigState {
  gameMode: GameMode;
  playerCount: number;
  roleCounts: Record<string, number>;
  showConfigToPlayers: boolean;
  showRolesInPlay: boolean;
  isValid: boolean;
  /** Increments on every user-initiated action. Used to detect when a sync is needed. */
  syncVersion: number;
}

const initialState: GameConfigState = {
  gameMode: GameMode.SecretVillain,
  playerCount: 5,
  roleCounts: {},
  showConfigToPlayers: false,
  showRolesInPlay: false,
  isValid: false,
  syncVersion: 0,
};

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
      state.roleCounts = roleCountsFromSlots(config.roleSlots ?? []);
      state.showConfigToPlayers = config.showConfigToPlayers;
      state.showRolesInPlay = config.showRolesInPlay;
      state.isValid = computeIsValid(
        config.gameMode,
        playerCount,
        state.roleCounts,
      );
    },

    setGameMode(state, action: PayloadAction<GameMode>) {
      state.gameMode = action.payload;
      const slots = GAME_MODES[action.payload].defaultRoleCount(
        state.playerCount,
      );
      state.roleCounts = roleCountsFromSlots(slots);
      state.isValid = computeIsValid(
        state.gameMode,
        state.playerCount,
        state.roleCounts,
      );
      state.syncVersion++;
    },

    incrementRoleCount(state, action: PayloadAction<string>) {
      const roleId = action.payload;
      state.roleCounts[roleId] = (state.roleCounts[roleId] ?? 0) + 1;
      state.isValid = computeIsValid(
        state.gameMode,
        state.playerCount,
        state.roleCounts,
      );
      state.syncVersion++;
    },

    decrementRoleCount(state, action: PayloadAction<string>) {
      const roleId = action.payload;
      state.roleCounts[roleId] = Math.max(
        0,
        (state.roleCounts[roleId] ?? 0) - 1,
      );
      state.isValid = computeIsValid(
        state.gameMode,
        state.playerCount,
        state.roleCounts,
      );
      state.syncVersion++;
    },

    setPlayerCount(state, action: PayloadAction<number>) {
      const { minPlayers } = GAME_MODES[state.gameMode];
      state.playerCount = Math.max(minPlayers, action.payload);
      state.isValid = computeIsValid(
        state.gameMode,
        state.playerCount,
        state.roleCounts,
      );
    },

    setShowConfigToPlayers(state, action: PayloadAction<boolean>) {
      state.showConfigToPlayers = action.payload;
      state.syncVersion++;
    },

    setShowRolesInPlay(state, action: PayloadAction<boolean>) {
      state.showRolesInPlay = action.payload;
      state.syncVersion++;
    },
  },
});

export const {
  loadConfig,
  setGameMode,
  incrementRoleCount,
  decrementRoleCount,
  setPlayerCount,
  setShowConfigToPlayers,
  setShowRolesInPlay,
} = gameConfigSlice.actions;

export default gameConfigSlice.reducer;
