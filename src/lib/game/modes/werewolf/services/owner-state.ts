import type { Game } from "@/lib/types";
import type { DaytimeNightStatusEntry } from "@/server/types";
import type { WerewolfPlayerGameState } from "../player-state";
import { getWerewolfModeConfig } from "../lobby-config";
import type {
  AltruistInterceptedNightResolutionEvent,
  AnyNightAction,
} from "../types";
import { WerewolfPhase } from "../types";
import { SMITE_PHASE_KEY, OLD_MAN_TIMER_KEY } from "../utils";
import { getSilencedPlayerIds, getHypnotizedPlayerId } from "../utils";
import { currentTurnState } from "../utils/game-state";
import {
  WerewolfRole,
  WEREWOLF_ROLES,
  isWerewolfRole,
  getWerewolfRole,
} from "../roles";

/** Extracts nightActions from the current turnState, if present. */
function extractNightActions(
  game: Game,
): Record<string, AnyNightAction> | undefined {
  const ts = currentTurnState(game);
  if (!ts) return undefined;
  const { nightActions } = ts.phase;
  if (ts.phase.type === WerewolfPhase.Nighttime) return nightActions;
  return Object.keys(nightActions).length > 0 ? nightActions : undefined;
}

/** Extracts deadPlayerIds from the Werewolf turn state. */
function extractDeadPlayerIds(game: Game): string[] {
  const ts = currentTurnState(game);
  return ts?.deadPlayerIds ?? [];
}

/** Extracts the Hunter revenge player ID (narrator-only). */
function extractHunterRevengePlayerId(game: Game): string | undefined {
  const ts = currentTurnState(game);
  return ts?.hunterRevengePlayerId;
}

/**
 * Extracts sanitized night outcomes for the daytime summary.
 * Shared between owner and player views.
 */
export function extractDaytimeNightSummary(
  game: Game,
  callerId: string,
): Partial<WerewolfPlayerGameState> {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== WerewolfPhase.Daytime) return {};
  const phase = ts.phase;

  const altruistIntercept = (phase.nightResolution ?? []).find(
    (e): e is AltruistInterceptedNightResolutionEvent =>
      e.type === "altruist-intercepted",
  );

  const nightStatus: DaytimeNightStatusEntry[] = (
    phase.nightResolution ?? []
  ).flatMap((e): DaytimeNightStatusEntry[] => {
    if (e.type === "killed" && e.died) {
      // Altruist death: emit altruist-sacrifice with savedPlayerId.
      if (e.targetPlayerId === altruistIntercept?.altruistPlayerId) {
        return [
          {
            targetPlayerId: e.targetPlayerId,
            effect: "altruist-sacrifice",
            savedPlayerId: altruistIntercept.savedPlayerId,
          },
        ];
      }
      if (e.attackedBy.includes(SMITE_PHASE_KEY)) {
        return [{ targetPlayerId: e.targetPlayerId, effect: "smited" }];
      }
      const effect =
        e.attackedBy.length === 1 && e.attackedBy[0] === OLD_MAN_TIMER_KEY
          ? "peaceful"
          : "killed";
      return [{ targetPlayerId: e.targetPlayerId, effect }];
    }
    // Attacked but saved by protection — visible to all when setting is on.
    if (
      e.type === "killed" &&
      !e.died &&
      e.protectedBy.length > 0 &&
      getWerewolfModeConfig(game).revealProtections
    ) {
      return [{ targetPlayerId: e.targetPlayerId, effect: "protected" }];
    }
    if (e.type === "tough-guy-absorbed" && e.targetPlayerId === callerId)
      return [{ targetPlayerId: e.targetPlayerId, effect: "survived" }];
    if (e.type === "silenced")
      return [{ targetPlayerId: e.targetPlayerId, effect: "silenced" }];
    if (e.type === "hypnotized")
      return [{ targetPlayerId: e.targetPlayerId, effect: "hypnotized" }];
    return [];
  });

  const result: Partial<WerewolfPlayerGameState> = {
    ...(nightStatus.length > 0 ? { nightStatus } : {}),
  };

  // Exposer reveal: show the publicly revealed role to all players.
  if (ts.exposerReveal) {
    const exposerReveal = ts.exposerReveal;
    const revealedPlayer = game.players.find(
      (p) => p.id === exposerReveal.playerId,
    );
    const revealedRoleDef = getWerewolfRole(exposerReveal.roleId);
    if (revealedPlayer && revealedRoleDef) {
      result.exposerReveal = {
        playerName: revealedPlayer.name,
        roleName: revealedRoleDef.name,
        team: revealedRoleDef.team,
      };
    }
  }

  return result;
}

/**
 * Extracts daytime trial and nomination state visible to a specific player.
 */
export function extractDaytimePlayerState(
  game: Game,
  callerId: string,
): Partial<WerewolfPlayerGameState> {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== WerewolfPhase.Daytime) return {};
  const phase = ts.phase;

  const result: Partial<WerewolfPlayerGameState> = {};

  // Nominations.
  if (getWerewolfModeConfig(game).nominationsEnabled) {
    const nominations = phase.nominations ?? [];
    const nominatorsByDefendant = nominations.reduce<Record<string, string[]>>(
      (acc, n) => {
        (acc[n.defendantId] ??= []).push(n.nominatorId);
        return acc;
      },
      {},
    );
    result.nominations = Object.entries(nominatorsByDefendant).map(
      ([defendantId, nominatorIds]) => ({ defendantId, nominatorIds }),
    );
    const myNomination = nominations.find((n) => n.nominatorId === callerId);
    if (myNomination) {
      result.myNominatedDefendantId = myNomination.defendantId;
    }
  }

  // Narrator-only: pending daytime smites.
  if (callerId === game.ownerPlayerId && phase.pendingSmitePlayerIds?.length) {
    result.pendingSmitePlayerIds = phase.pendingSmitePlayerIds;
  }

  // Executioner target.
  const callerExecutionerAssignment = game.roleAssignments.find(
    (a) =>
      a.playerId === callerId &&
      a.roleDefinitionId === (WerewolfRole.Executioner as string),
  );
  if (callerExecutionerAssignment && ts.executionerTargetId) {
    result.executionerTargetId = ts.executionerTargetId;
  }

  // Silenced / hypnotized.
  const silencedIds = getSilencedPlayerIds(ts);
  if (silencedIds.includes(callerId)) result.isSilenced = true;
  if (getHypnotizedPlayerId(ts) === callerId) result.isHypnotized = true;

  // Active trial.
  if (phase.activeTrial) {
    const { activeTrial } = phase;
    const alivePlayerCount = game.players.filter(
      (p) =>
        p.id !== game.ownerPlayerId &&
        p.id !== activeTrial.defendantId &&
        !ts.deadPlayerIds.includes(p.id) &&
        !silencedIds.includes(p.id),
    ).length;
    const myVote = activeTrial.votes.find((v) => v.playerId === callerId)?.vote;
    const playerById = new Map(game.players.map((p) => [p.id, p]));

    const callerRoleId = game.roleAssignments.find(
      (a) => a.playerId === callerId,
    )?.roleDefinitionId;
    const mustVoteGuilty =
      callerRoleId !== undefined &&
      isWerewolfRole(callerRoleId) &&
      WEREWOLF_ROLES[callerRoleId].alwaysVotesGuilty === true;
    const mustVoteInnocent =
      callerRoleId !== undefined &&
      isWerewolfRole(callerRoleId) &&
      WEREWOLF_ROLES[callerRoleId].alwaysVotesInnocent === true;

    result.activeTrial = {
      defendantId: activeTrial.defendantId,
      startedAt: activeTrial.startedAt,
      phase: activeTrial.phase,
      ...(activeTrial.voteStartedAt !== undefined
        ? { voteStartedAt: activeTrial.voteStartedAt }
        : {}),
      ...(myVote !== undefined ? { myVote } : {}),
      voteCount: activeTrial.votes.length,
      playerCount: alivePlayerCount,
      ...(activeTrial.verdict ? { verdict: activeTrial.verdict } : {}),
      ...(mustVoteGuilty ? { mustVoteGuilty: true } : {}),
      ...(mustVoteInnocent ? { mustVoteInnocent: true } : {}),
    };

    if (activeTrial.verdict) {
      result.activeTrial.voteResults = activeTrial.votes.map((v) => ({
        playerName: playerById.get(v.playerId)?.name ?? v.playerId,
        vote: v.vote,
      }));

      if (activeTrial.verdict === "eliminated") {
        const assignment = game.roleAssignments.find(
          (a) => a.playerId === activeTrial.defendantId,
        );
        const roleDef = assignment
          ? getWerewolfRole(assignment.roleDefinitionId)
          : undefined;
        if (roleDef) {
          result.activeTrial.eliminatedRole = {
            id: roleDef.id,
            name: roleDef.name,
            team: roleDef.team,
          };
        }
      }
    }
  }

  // Concluded trials count for this day.
  if (phase.concludedTrialsCount) {
    result.concludedTrialsCount = phase.concludedTrialsCount;
  }

  return result;
}

/**
 * Extracts complete owner/narrator state from the Werewolf game.
 */
export function extractOwnerState(
  game: Game,
): Partial<WerewolfPlayerGameState> {
  const nightActions = extractNightActions(game);
  const deadPlayerIds = extractDeadPlayerIds(game);
  const hunterRevengePlayerId = extractHunterRevengePlayerId(game);
  const callerId = game.ownerPlayerId ?? "";
  const daytimeNightState = extractDaytimeNightSummary(game, callerId);

  return {
    ...(nightActions ? { nightActions } : {}),
    ...daytimeNightState,
    ...(deadPlayerIds.length > 0 ? { deadPlayerIds } : {}),
    ...(hunterRevengePlayerId ? { hunterRevengePlayerId } : {}),
    ...(game.executionerTargetId
      ? { executionerTargetId: game.executionerTargetId }
      : {}),
  };
}

export { extractNightActions, extractDeadPlayerIds };
