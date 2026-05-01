import {
  GameMode,
  GameStatus,
  ShowRolesInPlay,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import type { Game } from "@/lib/types";
import { AvalonPhase, TeamVote, QuestCard } from "../../types";
import type { AvalonTurnState, TeamVotePhase, QuestPhase } from "../../types";
import { AvalonRole } from "../../roles";

export const roleAssignments = [
  { playerId: "p1", roleDefinitionId: AvalonRole.Merlin },
  { playerId: "p2", roleDefinitionId: AvalonRole.LoyalServant },
  { playerId: "p3", roleDefinitionId: AvalonRole.LoyalServant },
  { playerId: "p4", roleDefinitionId: AvalonRole.MinionOfMordred },
  { playerId: "p5", roleDefinitionId: AvalonRole.Assassin },
];

export const playerIds = roleAssignments.map((a) => a.playerId);

export function makePlayers() {
  return playerIds.map((id) => ({
    id,
    name: `Player ${id}`,
    sessionId: `session-${id}`,
    visiblePlayers: [],
  }));
}

export function makeGame(turnState: AvalonTurnState): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Avalon,
    status: { type: GameStatus.Playing, turnState },
    players: makePlayers(),
    roleAssignments,
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    timerConfig: DEFAULT_TIMER_CONFIG,
    modeConfig: { gameMode: GameMode.Avalon },
  } satisfies Game;
}

export function makeProposalTurnState(
  overrides: Partial<AvalonTurnState> = {},
): AvalonTurnState {
  return {
    questNumber: 1,
    phase: {
      type: AvalonPhase.TeamProposal,
      leaderId: "p1",
      teamSize: 2,
    },
    leaderOrder: [...playerIds],
    currentLeaderIndex: 0,
    questResults: [],
    consecutiveRejections: 0,
    questTeamSizes: [2, 3, 2, 3, 3],
    requiresTwoFails: [],
    ...overrides,
  };
}

export function makeVoteTurnState(
  votes: { playerId: string; vote: TeamVote }[] = [],
  passed?: boolean,
): AvalonTurnState {
  const phase: TeamVotePhase = {
    type: AvalonPhase.TeamVote,
    leaderId: "p1",
    proposedTeam: ["p1", "p3"],
    votes,
    ...(passed !== undefined ? { passed } : {}),
  };
  return makeProposalTurnState({ phase });
}

export function makeQuestTurnState(
  cards: { playerId: string; card: QuestCard }[] = [],
  failCount?: number,
): AvalonTurnState {
  const phase: QuestPhase = {
    type: AvalonPhase.Quest,
    leaderId: "p1",
    teamPlayerIds: ["p1", "p3"],
    cards,
    ...(failCount !== undefined ? { failCount } : {}),
  };
  return makeProposalTurnState({ phase });
}

export function getTurnState(game: Game): AvalonTurnState {
  if (game.status.type !== GameStatus.Playing) throw new Error("Not playing");
  return game.status.turnState as AvalonTurnState;
}
