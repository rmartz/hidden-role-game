import { Team, DEFAULT_TIMER_CONFIG } from "@/lib/types";
import type { GameModeConfig } from "@/lib/types";
import { MIN_PLAYERS, defaultRoleCount, CLOCKTOWER_ROLES } from "./roles";
import {
  DEFAULT_CLOCKTOWER_MODE_CONFIG,
  buildDefaultClocktowerLobbyConfig,
  parseClocktowerModeConfig,
} from "./lobby-config";
import { clocktowerServices } from "./services";
import { ClocktowerAction } from "./actions/types";
import { nominatePlayerAction } from "./actions/nominate-player";
import { castPublicVoteAction } from "./actions/cast-public-vote";
import { closeNominationsAction } from "./actions/close-nominations";

export const CLOCKTOWER_CONFIG = {
  name: "Clocktower",
  released: false,
  minPlayers: MIN_PLAYERS,
  ownerTitle: null,
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
  actions: {
    [ClocktowerAction.NominatePlayer]: nominatePlayerAction,
    [ClocktowerAction.CastPublicVote]: castPublicVoteAction,
    [ClocktowerAction.CloseNominations]: closeNominationsAction,
  },
  // Clocktower's Storyteller controls information delivery manually;
  // roles are not automatically revealed when a player dies.
  resolveRevealDeadPlayerIds: () => [],
  services: clocktowerServices,
} satisfies GameModeConfig;
