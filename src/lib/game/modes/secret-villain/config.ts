import type { GameModeConfig, ModeConfig } from "@/lib/types";
import { Team } from "@/lib/types";
import { isSecretVillainModeConfig } from "@/lib/types";

import { SECRET_VILLAIN_ACTIONS } from "./actions";
import {
  buildDefaultSecretVillainLobbyConfig,
  DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
  parseSecretVillainModeConfig,
} from "./lobby-config";
import { defaultRoleCount, MIN_PLAYERS, SECRET_VILLAIN_ROLES } from "./roles";
import { secretVillainServices } from "./services";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "./timer-config";

function hasBoard(modeConfig: ModeConfig): boolean {
  return (
    isSecretVillainModeConfig(modeConfig) && modeConfig.includeBoard === true
  );
}

export const SECRET_VILLAIN_CONFIG = {
  name: "Secret Villain",
  released: true,
  theme: "secret_villain",
  minPlayers: MIN_PLAYERS,
  ownerTitle: null,

  resolveOwnerTitle(modeConfig: ModeConfig): string | null {
    return hasBoard(modeConfig) ? "Board" : null;
  },

  resolveOwnerSeesRoleAssignments(modeConfig: ModeConfig): boolean {
    // Board player sees only public state — no role assignments.
    return !hasBoard(modeConfig);
  },

  resolveRoleSlotsRequired(numPlayers: number, modeConfig: ModeConfig): number {
    return hasBoard(modeConfig) ? numPlayers - 1 : numPlayers;
  },

  resolveIsValidRoleCount(
    numPlayers: number,
    roleCounts: Record<string, number>,
    modeConfig: ModeConfig,
  ): boolean {
    const rolePlayerCount = hasBoard(modeConfig) ? numPlayers - 1 : numPlayers;
    return (
      Object.values(roleCounts).reduce((a, b) => a + b, 0) === rolePlayerCount
    );
  },

  teamLabels: {
    [Team.Good]: "Liberal",
    [Team.Bad]: "Fascist",
  },
  roles: SECRET_VILLAIN_ROLES,
  defaultRoleCount,
  defaultTimerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
  defaultModeConfig: DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
  parseModeConfig: parseSecretVillainModeConfig,
  buildDefaultLobbyConfig: buildDefaultSecretVillainLobbyConfig,
  actions: SECRET_VILLAIN_ACTIONS,
  services: secretVillainServices,
} satisfies GameModeConfig;
