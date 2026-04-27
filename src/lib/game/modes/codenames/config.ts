import { Team, DEFAULT_TIMER_CONFIG } from "@/lib/types";
import type { GameModeConfig } from "@/lib/types";
import { MIN_PLAYERS, defaultRoleCount, CODENAMES_ROLES } from "./roles";
import {
  DEFAULT_CODENAMES_MODE_CONFIG,
  buildDefaultCodenamesLobbyConfig,
  parseCodenamesModeConfig,
} from "./lobby-config";
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
