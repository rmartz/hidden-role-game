import { Team, DEFAULT_TIMER_CONFIG } from "@/lib/types";
import type { GameModeConfig } from "@/lib/types";
import { MIN_PLAYERS, defaultRoleCount, AVALON_ROLES } from "./roles";
import { avalonServices } from "./services";

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
  defaultTimerConfig: DEFAULT_TIMER_CONFIG,
  actions: {},
  services: avalonServices,
} satisfies GameModeConfig;
