import { sum } from "lodash";
import { Team } from "@/lib/types";
import type { GameModeConfig, ModeConfig } from "@/lib/types";
import { isWerewolfModeConfig } from "@/lib/types";
import {
  MIN_PLAYERS,
  defaultRoleCount,
  WEREWOLF_ROLES,
  WerewolfRole,
} from "./roles";
import { WEREWOLF_ACTIONS } from "./actions";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "./timer-config";
import {
  DEFAULT_WEREWOLF_MODE_CONFIG,
  buildDefaultWerewolfLobbyConfig,
  getWerewolfModeConfig,
  parseWerewolfModeConfig,
} from "./lobby-config";
import { werewolfServices } from "./services";

function hiddenRoleCountFromConfig(modeConfig: ModeConfig): number {
  return isWerewolfModeConfig(modeConfig) ? modeConfig.hiddenRoleCount : 0;
}

export const WEREWOLF_CONFIG = {
  name: "Werewolf",
  released: true,
  minPlayers: MIN_PLAYERS,
  ownerTitle: "Narrator",
  teamLabels: {
    [Team.Good]: "Villagers",
    [Team.Bad]: "Evil",
    [Team.Neutral]: "Neutral",
  },
  roles: WEREWOLF_ROLES,
  defaultRoleCount,
  defaultTimerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  defaultModeConfig: DEFAULT_WEREWOLF_MODE_CONFIG,
  parseModeConfig: parseWerewolfModeConfig,
  buildDefaultLobbyConfig: buildDefaultWerewolfLobbyConfig,
  resolveRevealDeadPlayerIds(game, deadPlayerIds) {
    return getWerewolfModeConfig(game).showRolesOnDeath ? deadPlayerIds : [];
  },
  actions: WEREWOLF_ACTIONS,
  services: werewolfServices,
  // The Narrator is a player but doesn't receive a role.
  roleSlotsRequired(numPlayers: number) {
    return numPlayers - 1;
  },
  isValidRoleCount(numPlayers: number, roleCounts: Record<string, number>) {
    return sum(Object.values(roleCounts)) === numPlayers - 1;
  },
  /**
   * Returns the number of role slots required, accounting for hidden roles.
   * = (numPlayers - 1) + hiddenRoleCount (narrator excluded, hidden slots included).
   */
  resolveRoleSlotsRequired(numPlayers: number, modeConfig: ModeConfig): number {
    return numPlayers - 1 + hiddenRoleCountFromConfig(modeConfig);
  },
  /**
   * Validates the total configured role count, accounting for hidden roles.
   */
  resolveIsValidRoleCount(
    numPlayers: number,
    roleCounts: Record<string, number>,
    modeConfig: ModeConfig,
  ): boolean {
    const required = numPlayers - 1 + hiddenRoleCountFromConfig(modeConfig);
    return sum(Object.values(roleCounts)) === required;
  },
  /**
   * Returns the number of hidden roles to draw, from the Werewolf mode config.
   */
  resolveHiddenRoleCount(modeConfig: ModeConfig): number {
    return hiddenRoleCountFromConfig(modeConfig);
  },
  /**
   * Validates Werewolf-specific role count constraints.
   * Mason must appear 0 times or 2+ times — exactly 1 Mason is invalid.
   */
  validateRoleConfig(roleCounts: Record<string, number>): string | undefined {
    const masonCount = roleCounts[WerewolfRole.Mason] ?? 0;
    if (masonCount === 1) {
      return "Mason must be configured with 0 or 2+ copies — a lone Mason has no one to trust.";
    }
    return undefined;
  },
} satisfies GameModeConfig;
