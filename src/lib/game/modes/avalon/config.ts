import type { GameModeConfig } from "@/lib/types";
import { DEFAULT_TIMER_CONFIG,Team } from "@/lib/types";

import {
  advanceFromQuestAction,
  advanceFromTeamVoteAction,
  AvalonAction,
  castTeamVoteAction,
  playQuestCardAction,
  proposeTeamAction,
  resolveAssassinationAction,
  resolveQuestAction,
  resolveTeamVoteAction,
  selectAssassinationTargetAction,
} from "./actions";
import {
  buildDefaultAvalonLobbyConfig,
  DEFAULT_AVALON_MODE_CONFIG,
  parseAvalonModeConfig,
} from "./lobby-config";
import { AVALON_ROLES,defaultRoleCount, MIN_PLAYERS } from "./roles";
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
  actions: {
    [AvalonAction.ProposeTeam]: proposeTeamAction,
    [AvalonAction.CastTeamVote]: castTeamVoteAction,
    [AvalonAction.ResolveTeamVote]: resolveTeamVoteAction,
    [AvalonAction.AdvanceFromTeamVote]: advanceFromTeamVoteAction,
    [AvalonAction.PlayQuestCard]: playQuestCardAction,
    [AvalonAction.ResolveQuest]: resolveQuestAction,
    [AvalonAction.AdvanceFromQuest]: advanceFromQuestAction,
    [AvalonAction.SelectAssassinationTarget]: selectAssassinationTargetAction,
    [AvalonAction.ResolveAssassination]: resolveAssassinationAction,
  },
  services: avalonServices,
} satisfies GameModeConfig;
