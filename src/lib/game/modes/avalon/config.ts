import { Team, DEFAULT_TIMER_CONFIG } from "@/lib/types";
import type { GameModeConfig } from "@/lib/types";
import { MIN_PLAYERS, defaultRoleCount, AVALON_ROLES } from "./roles";
import {
  DEFAULT_AVALON_MODE_CONFIG,
  buildDefaultAvalonLobbyConfig,
  parseAvalonModeConfig,
} from "./lobby-config";
import { avalonServices } from "./services";

export const AVALON_CONFIG = {
  name: "Avalon",
  released: false,
  minPlayers: MIN_PLAYERS,
  ownerTitle: null,
  teamLabels: {
    [Team.Good]: "Good",
    [Team.Bad]: "Evil",
  },
  roles: AVALON_ROLES,
  defaultRoleCount,
  defaultTimerConfig: DEFAULT_TIMER_CONFIG,
  defaultModeConfig: DEFAULT_AVALON_MODE_CONFIG,
  parseModeConfig: parseAvalonModeConfig,
  buildDefaultLobbyConfig: buildDefaultAvalonLobbyConfig,
  actions: {},
  services: avalonServices,
} satisfies GameModeConfig;
