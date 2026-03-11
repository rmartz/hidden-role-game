import { Team } from "@/lib/types";
import type { GameModeConfig } from "@/lib/types";
import { MIN_PLAYERS, defaultRoleCount, SECRET_VILLAIN_ROLES } from "./roles";

export const SECRET_VILLAIN_CONFIG = {
  name: "Secret Villain",
  minPlayers: MIN_PLAYERS,
  ownerTitle: null,
  teamLabels: {
    [Team.Good]: "Liberal",
    [Team.Bad]: "Fascist",
  },
  roles: SECRET_VILLAIN_ROLES,
  defaultRoleCount,
  actions: {},
} satisfies GameModeConfig;
