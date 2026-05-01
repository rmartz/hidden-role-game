import { Team, DEFAULT_TIMER_CONFIG } from "@/lib/types";
import type { GameModeConfig } from "@/lib/types";
import { MIN_PLAYERS, defaultRoleCount, AVALON_ROLES } from "./roles";
import {
  DEFAULT_AVALON_MODE_CONFIG,
  buildDefaultAvalonLobbyConfig,
  parseAvalonModeConfig,
} from "./lobby-config";
import { avalonServices } from "./services";
import {
  AvalonAction,
  proposeTeamAction,
  castTeamVoteAction,
  resolveTeamVoteAction,
  advanceFromTeamVoteAction,
  playQuestCardAction,
  resolveQuestAction,
  advanceFromQuestAction,
  selectAssassinationTargetAction,
  resolveAssassinationAction,
} from "./actions";

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
