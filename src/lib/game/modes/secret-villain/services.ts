import { isSecretVillainModeConfig } from "@/lib/types";
import { GameStatus, Team } from "@/lib/types";
import type { Game, GameModeServices, PlayerRoleAssignment } from "@/lib/types";
import { resolvePlayerOrder } from "@/lib/player-order";
import { SecretVillainRole } from "./roles";
import {
  SecretVillainPhase,
  SpecialActionType,
  SvBoardPreset,
  VETO_UNLOCK_THRESHOLD,
} from "./types";
import type { SecretVillainTurnState, SvCustomPowerConfig } from "./types";
import {
  createDeck,
  currentTurnState,
  getDefaultBoardPreset,
  getEligibleChancellorIds,
  resolvePowerTable,
} from "./utils";
import {
  SecretVillainWinner,
  SvVictoryConditionKey,
} from "./utils/win-condition";
import { getSvThemeLabels } from "./themes";
import type { SvTheme } from "./themes";
import { SECRET_VILLAIN_COPY } from "./copy";
import type { VictoryCondition } from "@/server/types/game";

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

function buildPhaseInfo(
  phase: SecretVillainTurnState["phase"],
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    type: phase.type,
    presidentId: phase.presidentId,
  };
  if (
    phase.type === SecretVillainPhase.ElectionVote &&
    phase.chancellorNomineeId
  ) {
    base["chancellorNomineeId"] = phase.chancellorNomineeId;
    base["startedAt"] = phase.startedAt;
  }
  if (
    phase.type === SecretVillainPhase.PolicyPresident ||
    phase.type === SecretVillainPhase.PolicyChancellor
  ) {
    base["chancellorId"] = phase.chancellorId;
  }
  if (phase.type === SecretVillainPhase.SpecialAction) {
    base["actionType"] = phase.actionType;
  }
  return base;
}

interface BuildTurnStateOptions {
  playerOrder?: string[];
  executionerTargetId?: string;
}

function extractSvVictoryCondition(
  game: Game,
  svTheme: SvTheme | undefined,
): VictoryCondition | undefined {
  if (game.status.type !== GameStatus.Finished) return undefined;
  const conditionKey = game.status.victoryConditionKey as
    | SvVictoryConditionKey
    | undefined;
  if (!conditionKey) return undefined;
  const themeLabels = getSvThemeLabels(svTheme);
  const winner = game.status.winner;
  const winnerTeam = winner === SecretVillainWinner.Good ? Team.Good : Team.Bad;
  const vc = SECRET_VILLAIN_COPY.gameOver.victoryConditions;
  let label: string;
  switch (conditionKey) {
    case SvVictoryConditionKey.GoodPolicy:
      label = vc.goodPolicy(themeLabels.goodTeam);
      break;
    case SvVictoryConditionKey.BadPolicy:
      label = vc.badPolicy(themeLabels.badTeam);
      break;
    case SvVictoryConditionKey.SpecialBadElected:
      label = vc.specialBadElected(themeLabels.specialBadRole);
      break;
    case SvVictoryConditionKey.GoodShoot:
      label = vc.goodShoot(themeLabels.specialBadRole);
      break;
    case SvVictoryConditionKey.Chaos:
      label = vc.chaos(
        winnerTeam === Team.Good ? themeLabels.goodTeam : themeLabels.badTeam,
      );
      break;
    default:
      return undefined;
  }
  return { label, winner: winnerTeam };
}

export const secretVillainServices: GameModeServices = {
  buildInitialTurnState(
    roleAssignments: PlayerRoleAssignment[],
    options?: Record<string, unknown>,
  ): SecretVillainTurnState {
    const { playerOrder } = (options ?? {}) as BuildTurnStateOptions;
    const allPlayerIds = roleAssignments.map((a) => a.playerId);

    // Use the lobby's playerOrder if provided (preserving the seating arrangement
    // set in the lobby), otherwise fall back to a random shuffle.
    const playerIds =
      playerOrder && playerOrder.length > 0
        ? resolvePlayerOrder(playerOrder, allPlayerIds)
        : shuffle(allPlayerIds);

    const firstPresidentId = playerIds[0];
    if (!firstPresidentId) {
      throw new Error("No players to initialize Secret Villain game");
    }

    const boardPreset =
      (options?.["boardPreset"] as SvBoardPreset | undefined) ??
      getDefaultBoardPreset(playerIds.length);
    const customPowerTable = options?.["customPowerTable"] as
      | SvCustomPowerConfig
      | undefined;
    const powerTable = resolvePowerTable(
      boardPreset,
      customPowerTable,
      playerIds.length,
    );

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
      boardPreset,
      powerTable,
    };
  },

  selectSpecialTargets() {
    return {};
  },

  extractPlayerState(game: Game, callerId: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // Pass the theme to the client for cosmetic label resolution.
    // This must be set before the turnState guard so it's available during Starting status.
    if (isSecretVillainModeConfig(game.modeConfig) && game.modeConfig.theme) {
      result["svTheme"] = game.modeConfig.theme;
    }

    // In a 2-fascist game (exactly 1 Bad + 1 Special Bad), the Special Bad can
    // identify their only Bad teammate — there is no ambiguity to protect.
    const callerAssignment = game.roleAssignments.find(
      (a) => a.playerId === callerId,
    );
    if (
      (callerAssignment?.roleDefinitionId as SecretVillainRole | undefined) ===
      SecretVillainRole.SpecialBad
    ) {
      const badTeamIds = game.roleAssignments
        .filter(
          (a) =>
            (a.roleDefinitionId as SecretVillainRole) === SecretVillainRole.Bad,
        )
        .map((a) => a.playerId);
      const specialBadCount = game.roleAssignments.filter(
        (a) =>
          (a.roleDefinitionId as SecretVillainRole) ===
          SecretVillainRole.SpecialBad,
      ).length;
      if (badTeamIds.length === 1 && specialBadCount === 1) {
        result["modeVisiblePlayerIds"] = badTeamIds;
      }
    }

    const ts = currentTurnState(game);

    // Populate victory condition when the game is finished.
    const svTheme = result["svTheme"] as SvTheme | undefined;
    const victoryCondition = extractSvVictoryCondition(game, svTheme);
    if (victoryCondition) {
      result["victoryCondition"] = victoryCondition;
    }

    if (!ts) return result;

    const { phase } = ts;

    // Phase info — visible to all players.
    result["svPhase"] = buildPhaseInfo(phase);

    // Board state — visible to all players.
    result["svBoard"] = {
      goodCardsPlayed: ts.goodCardsPlayed,
      badCardsPlayed: ts.badCardsPlayed,
      failedElectionCount: ts.failedElectionCount,
      powerTable: ts.powerTable,
    };

    // Veto unlock status.
    if (ts.badCardsPlayed >= VETO_UNLOCK_THRESHOLD) {
      result["vetoUnlocked"] = true;
    }

    // President sees drawn cards during policy president phase (after drawing).
    if (
      phase.type === SecretVillainPhase.PolicyPresident &&
      phase.presidentId === callerId &&
      phase.cardsRevealed
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

    // President sees investigation waiting state (target selected, awaiting consent).
    if (
      phase.type === SecretVillainPhase.SpecialAction &&
      phase.actionType === SpecialActionType.InvestigateTeam &&
      phase.presidentId === callerId &&
      phase.targetPlayerId &&
      !phase.revealedTeam
    ) {
      result["svInvestigationWaitingForPlayerId"] = phase.targetPlayerId;
    }

    // President sees investigation result.
    if (
      phase.type === SecretVillainPhase.SpecialAction &&
      phase.presidentId === callerId &&
      phase.revealedTeam
    ) {
      result["svInvestigationResult"] = {
        targetPlayerId: phase.targetPlayerId ?? "",
        team: phase.revealedTeam,
      };
    }

    // Investigation consent target sees a prompt.
    if (
      phase.type === SecretVillainPhase.SpecialAction &&
      phase.actionType === SpecialActionType.InvestigateTeam &&
      phase.targetPlayerId === callerId &&
      !phase.targetConsented
    ) {
      result["svInvestigationConsent"] = true;
    }

    // Election vote phase: include the player's own vote and vote count.
    if (phase.type === SecretVillainPhase.ElectionVote) {
      const myVote = phase.votes.find((v) => v.playerId === callerId);
      if (myVote) {
        result["myElectionVote"] = myVote.vote;
      }
      // Who has voted (not how) — used for voter status display.
      result["electionVoteCount"] = phase.votes.length;
      result["votedPlayerIds"] = phase.votes.map((v) => v.playerId);
      // After tally, share full results.
      if (phase.passed !== undefined) {
        result["electionVotes"] = phase.votes;
        result["electionPassed"] = phase.passed;
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
