import type { GameModeConfig } from "@/lib/types";
import { DEFAULT_TIMER_CONFIG, Team } from "@/lib/types";

import {
  buildDefaultCodenamesLobbyConfig,
  DEFAULT_CODENAMES_MODE_CONFIG,
  parseCodenamesModeConfig,
} from "./lobby-config";
import { CODENAMES_ROLES, defaultRoleCount, MIN_PLAYERS } from "./roles";
import { codenamesServices } from "./services";

export const CODENAMES_CONFIG = {
  name: "Codenames",
  released: false,
  minPlayers: MIN_PLAYERS,
  ownerTitle: null,
  teamLabels: {
    [Team.Good]: "Red",
    [Team.Bad]: "Blue",
  },
  roles: CODENAMES_ROLES,
  defaultRoleCount,
  defaultTimerConfig: DEFAULT_TIMER_CONFIG,
  defaultModeConfig: DEFAULT_CODENAMES_MODE_CONFIG,
  parseModeConfig: parseCodenamesModeConfig,
  buildDefaultLobbyConfig: buildDefaultCodenamesLobbyConfig,
  actions: {},
  services: codenamesServices,
} satisfies GameModeConfig;
