import { Team, DEFAULT_TIMER_CONFIG } from "@/lib/types";
import type { GameModeConfig } from "@/lib/types";
import { MIN_PLAYERS, defaultRoleCount, CLOCKTOWER_ROLES } from "./roles";
import {
  DEFAULT_CLOCKTOWER_MODE_CONFIG,
  buildDefaultClocktowerLobbyConfig,
  parseClocktowerModeConfig,
} from "./lobby-config";
import { clocktowerServices } from "./services";

export const CLOCKTOWER_CONFIG = {
  name: "Clocktower",
  released: false,
  minPlayers: MIN_PLAYERS,
  ownerTitle: "Storyteller",
  teamLabels: {
    [Team.Good]: "Good",
    [Team.Bad]: "Evil",
  },
  roles: CLOCKTOWER_ROLES,
  defaultRoleCount,
  defaultTimerConfig: DEFAULT_TIMER_CONFIG,
  defaultModeConfig: DEFAULT_CLOCKTOWER_MODE_CONFIG,
  parseModeConfig: parseClocktowerModeConfig,
  buildDefaultLobbyConfig: buildDefaultClocktowerLobbyConfig,
  actions: {},
  services: clocktowerServices,
} satisfies GameModeConfig;
