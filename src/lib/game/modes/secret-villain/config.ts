import { sum } from "lodash";
import { Team } from "@/lib/types";
import type { GameModeConfig, ModeConfig } from "@/lib/types";
import { isSecretVillainModeConfig } from "@/lib/types";
import { MIN_PLAYERS, defaultRoleCount, SECRET_VILLAIN_ROLES } from "./roles";
import { SECRET_VILLAIN_ACTIONS } from "./actions";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "./timer-config";
import {
  DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
  buildDefaultSecretVillainLobbyConfig,
  parseSecretVillainModeConfig,
} from "./lobby-config";
import { secretVillainServices } from "./services";

function hasBoard(modeConfig: ModeConfig): boolean {
  return (
    isSecretVillainModeConfig(modeConfig) && modeConfig.includeBoard === true
  );
}

export const SECRET_VILLAIN_CONFIG = {
  name: "Secret Villain",
  released: true,
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
    return sum(Object.values(roleCounts)) === rolePlayerCount;
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
