import { Team } from "@/lib/models";
import type { GameModeConfig } from "@/lib/models";
import { MIN_PLAYERS, defaultRoleCount, AVALON_ROLES } from "./roles";

export const AVALON_CONFIG = {
  name: "Avalon",
  minPlayers: MIN_PLAYERS,
  ownerTitle: null,
  teamLabels: {
    [Team.Good]: "Good",
    [Team.Bad]: "Evil",
  },
  roles: AVALON_ROLES,
  defaultRoleCount,
  actions: {},
} satisfies GameModeConfig;
