import type { GameModeConfig } from "@/lib/types";
import { DEFAULT_TIMER_CONFIG, Team } from "@/lib/types";

import { CLOCKTOWER_ACTIONS } from "./actions";
import {
  buildDefaultClocktowerLobbyConfig,
  DEFAULT_CLOCKTOWER_MODE_CONFIG,
  parseClocktowerModeConfig,
} from "./lobby-config";
import { CLOCKTOWER_ROLES, defaultRoleCount, MIN_PLAYERS } from "./roles";
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
  actions: CLOCKTOWER_ACTIONS,
  // Clocktower's Storyteller controls information delivery manually;
  // roles are not automatically revealed when a player dies.
  resolveRevealDeadPlayerIds: () => [],
  services: clocktowerServices,
} satisfies GameModeConfig;
