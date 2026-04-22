import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";
import { ClocktowerPhase } from "../types";
import type { ClocktowerTurnState } from "../types";
import { ClocktowerRole } from "../roles";

function currentTurnState(game: Game): ClocktowerTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as ClocktowerTurnState | undefined;
}

function getPlayerRole(
  game: Game,
  playerId: string,
): ClocktowerRole | undefined {
  const assignment = game.roleAssignments.find((a) => a.playerId === playerId);
  if (!assignment) return undefined;
  const roleId = assignment.roleDefinitionId;
  return Object.values(ClocktowerRole).includes(roleId as ClocktowerRole)
    ? (roleId as ClocktowerRole)
    : undefined;
}

export const castPublicVoteAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== ClocktowerPhase.Day) return false;
    // Only one execution per day — no voting once resolved
    if (ts.phase.executedToday !== undefined) return false;

    const { nomineeId, voted } = payload as {
      nomineeId?: unknown;
      voted?: unknown;
    };
    if (typeof nomineeId !== "string") return false;
    if (typeof voted !== "boolean") return false;

    // Find the target nomination
    const nomination = ts.phase.nominations.find(
      (n) => n.nomineeId === nomineeId,
    );
    if (!nomination) return false;

    const isDead = ts.deadPlayerIds.includes(callerId);
    // Dead players can only vote "yes" using their single ghost vote
    if (isDead) {
      if (!voted) return false;
      if (ts.ghostVotesUsed.includes(callerId)) return false;
    }

    // Butler may only vote yes if their master has already voted yes on this nomination
    const callerRole = getPlayerRole(game, callerId);
    if (callerRole === ClocktowerRole.Butler && voted && ts.butlerMasterId) {
      const masterHasVotedYes = nomination.votes.some(
        (v) => v.playerId === ts.butlerMasterId && v.voted,
      );
      if (!masterHasVotedYes) return false;
    }

    // Must be a valid player
    return game.players.some((p) => p.id === callerId);
  },

  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== ClocktowerPhase.Day) return;

    const { nomineeId, voted } = payload as {
      nomineeId: string;
      voted: boolean;
    };

    const nomination = ts.phase.nominations.find(
      (n) => n.nomineeId === nomineeId,
    );
    if (!nomination) return;

    const isDead = ts.deadPlayerIds.includes(callerId);
    if (isDead && voted) {
      ts.ghostVotesUsed = [...ts.ghostVotesUsed, callerId];
    }

    const existing = nomination.votes.findIndex((v) => v.playerId === callerId);
    if (existing >= 0) {
      nomination.votes = nomination.votes.map((v, i) =>
        i === existing ? { playerId: callerId, voted } : v,
      );
    } else {
      nomination.votes = [...nomination.votes, { playerId: callerId, voted }];
    }
  },
};
