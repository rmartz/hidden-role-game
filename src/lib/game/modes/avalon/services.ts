import { GameStatus } from "@/lib/types";
import type { Game, GameModeServices, PlayerRoleAssignment } from "@/lib/types";
import { resolvePlayerOrder } from "@/lib/player-order";
import { AvalonPhase } from "./types";
import type { AvalonTurnState } from "./types";
import type { AvalonPublicPhase } from "./player-state";

// ---------------------------------------------------------------------------
// Quest configuration tables (standard Avalon rules)
// ---------------------------------------------------------------------------

/**
 * Quest team sizes keyed by player count (5–10).
 * Each tuple is [Q1, Q2, Q3, Q4, Q5] team sizes for that player count.
 */
const QUEST_TEAM_SIZES: Record<
  number,
  [number, number, number, number, number]
> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};

/**
 * Quest numbers (1-based) that require 2 Fail cards to fail.
 * Only Quest 4 at 7+ players.
 */
function requiresTwoFailsQuests(playerCount: number): number[] {
  return playerCount >= 7 ? [4] : [];
}

function getQuestTeamSizes(
  playerCount: number,
): [number, number, number, number, number] {
  const sizes = QUEST_TEAM_SIZES[playerCount];
  if (!sizes) {
    throw new Error(
      "No quest configuration for " + String(playerCount) + " players",
    );
  }
  return sizes;
}

// ---------------------------------------------------------------------------
// Shuffle utility
// ---------------------------------------------------------------------------

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i] as T;
    result[i] = result[j] as T;
    result[j] = temp;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Build options type
// ---------------------------------------------------------------------------

interface BuildTurnStateOptions {
  playerOrder?: string[];
}

// ---------------------------------------------------------------------------
// currentTurnState helper
// ---------------------------------------------------------------------------

function currentTurnState(game: Game): AvalonTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as AvalonTurnState | undefined;
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const avalonServices: GameModeServices = {
  buildInitialTurnState(
    roleAssignments: PlayerRoleAssignment[],
    options?: Record<string, unknown>,
  ): AvalonTurnState {
    const { playerOrder } = (options ?? {}) as BuildTurnStateOptions;
    const allPlayerIds = roleAssignments.map((a) => a.playerId);

    // Preserve seating order from the lobby when available; otherwise randomize.
    const orderedPlayerIds =
      playerOrder && playerOrder.length > 0
        ? resolvePlayerOrder(playerOrder, allPlayerIds)
        : shuffle(allPlayerIds);

    const firstLeaderId = orderedPlayerIds[0];
    if (!firstLeaderId) {
      throw new Error("No players to initialize Avalon game");
    }

    const playerCount = orderedPlayerIds.length;
    const questTeamSizes = getQuestTeamSizes(playerCount);
    const requiresTwoFails = requiresTwoFailsQuests(playerCount);
    const firstTeamSize = questTeamSizes[0];

    return {
      questNumber: 1,
      phase: {
        type: AvalonPhase.TeamProposal,
        leaderId: firstLeaderId,
        teamSize: firstTeamSize,
      },
      leaderOrder: orderedPlayerIds,
      currentLeaderIndex: 0,
      questResults: [],
      consecutiveRejections: 0,
      questTeamSizes,
      requiresTwoFails,
    };
  },

  selectSpecialTargets(): Record<string, string> {
    return {};
  },

  extractPlayerState(game: Game, callerId: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    const ts = currentTurnState(game);
    if (!ts) return result;

    const { phase, questResults, consecutiveRejections, questNumber } = ts;

    // All players see quest results, current quest info, consecutive rejections,
    // and the current phase (with public fields only).
    result["questResults"] = questResults;
    result["consecutiveRejections"] = consecutiveRejections;
    result["currentQuest"] = {
      questNumber,
      teamSize: ts.questTeamSizes[questNumber - 1],
      requiresTwoFails: ts.requiresTwoFails.includes(questNumber),
    };

    // Build public phase info (safe for all players to see).
    const publicPhase = buildPublicPhase(phase);
    result["avalonPhase"] = publicPhase;

    // Proposed team visible to all during team vote.
    if (
      phase.type === AvalonPhase.TeamVote ||
      phase.type === AvalonPhase.TeamProposal
    ) {
      if (phase.proposedTeam) {
        result["proposedTeam"] = phase.proposedTeam;
      }
    }

    // Team vote results visible to all after vote resolves.
    if (phase.type === AvalonPhase.TeamVote) {
      const myVote = phase.votes.find((v) => v.playerId === callerId);
      if (myVote) {
        result["myTeamVote"] = myVote.vote;
      }
      if (phase.passed !== undefined) {
        result["teamVotes"] = phase.votes;
        result["teamVotePassed"] = phase.passed;
      }
    }

    // Quest phase: team member sees their own played card after playing.
    if (phase.type === AvalonPhase.Quest) {
      const myCard = phase.cards.find((c) => c.playerId === callerId);
      if (myCard) {
        result["myQuestCard"] = myCard.card;
      }
      // After all cards are submitted, reveal fail count to all.
      if (phase.failCount !== undefined) {
        result["questFailCount"] = phase.failCount;
      }
    }

    // Quest Leader sees eligible team members during proposal.
    if (
      phase.type === AvalonPhase.TeamProposal &&
      phase.leaderId === callerId
    ) {
      result["eligibleTeamMemberIds"] = ts.leaderOrder;
    }

    // Assassination phase: all players see the assassin's target (if selected).
    if (phase.type === AvalonPhase.Assassination) {
      if (phase.targetPlayerId) {
        result["assassinationTarget"] = phase.targetPlayerId;
      }

      // Assassin sees all players as valid targets.
      if (callerId === phase.assassinPlayerId) {
        result["assassinationTargetIds"] = ts.leaderOrder;
      }
    }

    return result;
  },
};

// ---------------------------------------------------------------------------
// Public phase builder — strips server-only fields (e.g. full card lists)
// ---------------------------------------------------------------------------

function buildPublicPhase(phase: AvalonTurnState["phase"]): AvalonPublicPhase {
  const base: AvalonPublicPhase = { type: phase.type };

  if (
    phase.type === AvalonPhase.TeamProposal ||
    phase.type === AvalonPhase.TeamVote ||
    phase.type === AvalonPhase.Quest
  ) {
    base.leaderId = phase.leaderId;
  }

  if (phase.type === AvalonPhase.TeamProposal) {
    base.teamSize = phase.teamSize;
  }

  if (phase.type === AvalonPhase.Quest) {
    base.teamPlayerIds = phase.teamPlayerIds;
  }

  return base;
}
