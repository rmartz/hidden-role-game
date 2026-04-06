import { Team } from "@/lib/types";
import type { GameModeConfig } from "@/lib/types";
import { MIN_PLAYERS, defaultRoleCount, SECRET_VILLAIN_ROLES } from "./roles";
import { SECRET_VILLAIN_ACTIONS } from "./actions";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "./timer-config";
import {
  DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
  buildDefaultSecretVillainLobbyConfig,
  parseSecretVillainModeConfig,
} from "./lobby-config";
import { secretVillainServices } from "./services";

export const SECRET_VILLAIN_CONFIG = {
  name: "Secret Villain",
  released: true,
  minPlayers: MIN_PLAYERS,
  ownerTitle: null,
  teamLabels: {
    [Team.Good]: "Liberal",
    [Team.Bad]: "Fascist",
  },
  roles: SECRET_VILLAIN_ROLES,
  defaultRoleCount,
  defaultTimerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
  defaultModeConfig: DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
  parseModeConfig: parseSecretVillainModeConfig,
  buildDefaultLobbyConfig: buildDefaultSecretVillainLobbyConfig,
  actions: SECRET_VILLAIN_ACTIONS,
  services: secretVillainServices,
} satisfies GameModeConfig;
