import { sum } from "lodash";
import { Team } from "@/lib/types";
import type { GameModeConfig } from "@/lib/types";
import { MIN_PLAYERS, defaultRoleCount, WEREWOLF_ROLES } from "./roles";
import { WEREWOLF_ACTIONS } from "./actions";

/** Number of nominations required to automatically start an elimination trial. */
export const NOMINATION_VOTE_THRESHOLD = 2;

export const WEREWOLF_CONFIG = {
  name: "Werewolf",
  minPlayers: MIN_PLAYERS,
  ownerTitle: "Narrator",
  teamLabels: {
    [Team.Good]: "Villagers",
    [Team.Bad]: "Werewolves",
    [Team.Neutral]: "Neutral",
  },
  roles: WEREWOLF_ROLES,
  defaultRoleCount,
  actions: WEREWOLF_ACTIONS,
  // The Narrator is a player but doesn't receive a role.
  roleSlotsRequired(numPlayers: number) {
    return numPlayers - 1;
  },
  isValidRoleCount(numPlayers: number, roleCounts: Record<string, number>) {
    return sum(Object.values(roleCounts)) === numPlayers - 1;
  },
} satisfies GameModeConfig;
