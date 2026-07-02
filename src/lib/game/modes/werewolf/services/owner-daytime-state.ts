import type { Game } from "@/lib/types";

import { getWerewolfModeConfig } from "../lobby-config";
import type { WerewolfPlayerGameState } from "../player-state";
import {
  getWerewolfRole,
  isWerewolfRole,
  WEREWOLF_ROLES,
  WerewolfRole,
} from "../roles";
import { TrialVerdict, WerewolfPhase } from "../types";
import { getHypnotizedPlayerId, getSilencedPlayerIds } from "../utils";
import { currentTurnState } from "../utils/game-state";

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
  if (callerExecutionerAssignment && ts.roleState?.executioner?.targetId) {
    result.executionerTargetId = ts.roleState.executioner.targetId;
  }

  // The Thing tap notification.
  if (ts.roleState?.theThing?.tapped === callerId) result.thingTappedMe = true;

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
      ...(activeTrial.pausedAt !== undefined
        ? { pausedAt: activeTrial.pausedAt }
        : {}),
      ...(activeTrial.pauseOffset !== undefined
        ? { pauseOffset: activeTrial.pauseOffset }
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

      // Expose whether the defendant was actually eliminated so both player
      // and narrator panels can derive "spared" from the same source of truth.
      // Only meaningful for Eliminated verdicts; leave undefined for Innocent.
      if (activeTrial.verdict === TrialVerdict.Eliminated) {
        result.activeTrial.defendantEliminated = ts.deadPlayerIds.includes(
          activeTrial.defendantId,
        );
      }

      // Suppress eliminatedRole if the defendant survived (e.g. Martyr intercept).
      // Only reveal when the defendant is actually dead.
      if (
        activeTrial.verdict === TrialVerdict.Eliminated &&
        ts.deadPlayerIds.includes(activeTrial.defendantId)
      ) {
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

  // Martyr window: expose pendingGuiltId so the UI can display the window.
  if (phase.pendingGuiltId) {
    result.pendingGuiltId = phase.pendingGuiltId;
  }

  // Martyr ability used flag: only expose to the Martyr player so they know
  // whether they can still intervene.
  const callerMartyrAssignment = game.roleAssignments.find(
    (a) =>
      a.playerId === callerId &&
      a.roleDefinitionId === (WerewolfRole.Martyr as string),
  );
  if (callerMartyrAssignment && ts.roleState?.martyr?.abilityUsed) {
    result.martyrUsed = true;
  }

  // Ghost clues — visible to all players during daytime.
  const ghostClues =
    ts.roleState?.ghost?.clues.filter((c) => c.turn <= ts.turn) ?? [];
  if (ghostClues.length > 0) {
    result.ghostClues = ghostClues;
  }

  // Ghost clue submission status — only relevant for the Ghost player.
  const callerAssignment = game.roleAssignments.find(
    (a) => a.playerId === callerId,
  );
  if (callerAssignment?.roleDefinitionId === (WerewolfRole.Ghost as string)) {
    const submittedThisTurn = (ts.roleState?.ghost?.clues ?? []).some(
      (c) => c.turn === ts.turn,
    );
    result.ghostClueSubmittedThisTurn = submittedThisTurn;
  }

  return result;
}
