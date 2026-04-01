import { GameStatus } from "@/lib/types";
import type { Game, GameModeServices, PlayerRoleAssignment } from "@/lib/types";
import { SecretVillainPhase } from "./types";
import type { SecretVillainTurnState } from "./types";
import { createDeck, getEligibleChancellorIds } from "./utils";

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

export const secretVillainServices: GameModeServices = {
  buildInitialTurnState(
    roleAssignments: PlayerRoleAssignment[],
  ): SecretVillainTurnState {
    const playerIds = shuffle(roleAssignments.map((a) => a.playerId));
    const firstPresidentId = playerIds[0];
    if (!firstPresidentId) {
      throw new Error("No players to initialize Secret Villain game");
    }

    return {
      turn: 1,
      phase: {
        type: SecretVillainPhase.ElectionNomination,
        startedAt: Date.now(),
        presidentId: firstPresidentId,
      },
      presidentOrder: playerIds,
      currentPresidentIndex: 1,
      goodCardsPlayed: 0,
      badCardsPlayed: 0,
      deck: createDeck(),
      discardPile: [],
      eliminatedPlayerIds: [],
      failedElectionCount: 0,
    };
  },

  selectSpecialTargets() {
    return {};
  },

  extractPlayerState(game: Game, callerId: string): Record<string, unknown> {
    if (game.status.type !== GameStatus.Playing) return {};
    const ts = game.status.turnState as SecretVillainTurnState | undefined;
    if (!ts) return {};

    const result: Record<string, unknown> = {};
    const { phase } = ts;

    // President sees drawn cards during policy president phase.
    if (
      phase.type === SecretVillainPhase.PolicyPresident &&
      phase.presidentId === callerId
    ) {
      result["policyCards"] = {
        drawnCards: phase.drawnCards,
        ...(phase.discardedCard !== undefined
          ? { discardedCard: phase.discardedCard }
          : {}),
      };
    }

    // Chancellor sees remaining cards during policy chancellor phase.
    if (
      phase.type === SecretVillainPhase.PolicyChancellor &&
      phase.chancellorId === callerId
    ) {
      result["policyCards"] = {
        remainingCards: phase.remainingCards,
        vetoProposed: phase.vetoProposed,
        vetoResponse: phase.vetoResponse,
      };
    }

    // President sees veto proposal during chancellor phase.
    if (
      phase.type === SecretVillainPhase.PolicyChancellor &&
      phase.presidentId === callerId &&
      phase.vetoProposed
    ) {
      result["vetoProposal"] = {
        vetoProposed: true,
        vetoResponse: phase.vetoResponse,
      };
    }

    // President sees peeked cards during policy peek.
    if (
      phase.type === SecretVillainPhase.SpecialAction &&
      phase.presidentId === callerId &&
      phase.peekedCards
    ) {
      result["policyCards"] = { peekedCards: phase.peekedCards };
    }

    // President sees investigation result.
    if (
      phase.type === SecretVillainPhase.SpecialAction &&
      phase.presidentId === callerId &&
      phase.revealedTeam
    ) {
      result["investigationResult"] = {
        targetPlayerId: phase.targetPlayerId ?? "",
        team: phase.revealedTeam,
      };
    }

    // Election vote phase: include the player's own vote.
    if (phase.type === SecretVillainPhase.ElectionVote) {
      const myVote = phase.votes.find((v) => v.playerId === callerId);
      if (myVote) {
        result["myElectionVote"] = myVote.vote;
      }
    }

    // Eligible chancellors for nomination phase (president only).
    if (
      phase.type === SecretVillainPhase.ElectionNomination &&
      phase.presidentId === callerId
    ) {
      result["eligibleChancellorIds"] = getEligibleChancellorIds(ts, callerId);
    }

    // Eliminated state.
    if (ts.eliminatedPlayerIds.includes(callerId)) {
      result["amDead"] = true;
    }
    if (ts.eliminatedPlayerIds.length > 0) {
      result["deadPlayerIds"] = ts.eliminatedPlayerIds;
    }

    return result;
  },
};
