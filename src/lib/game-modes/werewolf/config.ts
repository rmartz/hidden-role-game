import { sum } from "lodash";
import { Team } from "@/lib/types";
import type { GameModeConfig } from "@/lib/types";
import { MIN_PLAYERS, defaultRoleCount, WEREWOLF_ROLES } from "./roles";
import { WEREWOLF_ACTIONS } from "./actions";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "./timer-config";
import { werewolfServices } from "./services";

export const WEREWOLF_CONFIG = {
  name: "Werewolf",
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
  actions: WEREWOLF_ACTIONS,
  services: werewolfServices,
  // The Narrator is a player but doesn't receive a role.
  roleSlotsRequired(numPlayers: number) {
    return numPlayers - 1;
  },
  isValidRoleCount(numPlayers: number, roleCounts: Record<string, number>) {
    return sum(Object.values(roleCounts)) === numPlayers - 1;
  },
} satisfies GameModeConfig;
