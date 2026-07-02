import type { Game } from "@/lib/types";

import type { WerewolfPlayerGameState } from "../player-state";
import type { WerewolfRoleDefinition } from "../roles";
import { getWerewolfRole, WerewolfRole } from "../roles";
import type { AnyNightAction, WerewolfTurnState } from "../types";
import { isTeamNightAction, TargetCategory, WerewolfPhase } from "../types";
import {
  baseGroupPhaseKey,
  currentTurnState,
  getGroupPhasePlayerIds,
} from "../utils";
import { appendInvestigationResult } from "./player-night-state-helpers";
import { extractRoleSpecificState } from "./player-night-state-roles";

function hasPriestActiveWard(ts: WerewolfTurnState | undefined): boolean {
  if (!ts?.roleState?.priest?.wards) return false;
  return Object.keys(ts.roleState.priest.wards).some(
    (wardedId) => !ts.deadPlayerIds.includes(wardedId),
  );
}

/**
 * Extracts night targeting state for a non-owner player.
 * Handles group phases, solo roles, investigation results, and
 * role-specific abilities (Witch, Altruist, Exposer, etc.).
 */
export function extractPlayerNightState(
  game: Game,
  callerId: string,
  myRole: WerewolfRoleDefinition,
  deadPlayerIds: string[],
): Partial<WerewolfPlayerGameState> {
  const ts = currentTurnState(game);
  const nightActions = ts?.phase.nightActions ?? {};

  // Resolve effective role: a roleOverride (e.g. Village Drunk sobering into
  // a new role) takes precedence over the original assignment.
  const overriddenRoleId = ts?.roleOverrides?.[callerId];
  const effectiveRole = overriddenRoleId
    ? (getWerewolfRole(overriddenRoleId) ?? myRole)
    : myRole;

  // Group phase handling.
  const groupPhaseKey = effectiveRole.teamTargeting
    ? effectiveRole.id
    : effectiveRole.wakesWith;

  if (groupPhaseKey) {
    return extractGroupPhaseState(
      game,
      callerId,
      groupPhaseKey,
      nightActions,
      deadPlayerIds,
      ts,
    );
  }

  // Role-specific solo extractions.
  const roleResult = extractRoleSpecificState(
    game,
    callerId,
    effectiveRole,
    nightActions,
    deadPlayerIds,
    ts,
  );
  if (roleResult) return roleResult;

  // Generic solo action handling.
  return extractGenericSoloState(game, effectiveRole, nightActions, ts);
}

function extractGroupPhaseState(
  game: Game,
  callerId: string,
  groupPhaseKey: string,
  nightActions: Record<string, AnyNightAction>,
  deadPlayerIds: string[],
  ts: WerewolfTurnState | undefined,
): Partial<WerewolfPlayerGameState> {
  const activePhaseKey =
    ts?.phase.type === WerewolfPhase.Nighttime
      ? ts.phase.nightPhaseOrder[ts.phase.currentPhaseIndex]
      : undefined;
  const lookupKey =
    activePhaseKey && baseGroupPhaseKey(activePhaseKey) === groupPhaseKey
      ? activePhaseKey
      : groupPhaseKey;

  let previousNightTargetId: string | undefined;
  if (lookupKey !== groupPhaseKey) {
    const baseAction = nightActions[groupPhaseKey];
    if (baseAction && isTeamNightAction(baseAction)) {
      previousNightTargetId = baseAction.suggestedTargetId;
    }
  }

  // Gate Evil Empath reveal on effective Werewolf role (respects roleOverrides).
  const callerAssignment = game.roleAssignments.find(
    (a) => a.playerId === callerId,
  );
  const callerEffectiveRoleId =
    ts?.roleOverrides?.[callerId] ?? callerAssignment?.roleDefinitionId ?? "";
  const isEffectiveWerewolf =
    getWerewolfRole(callerEffectiveRoleId)?.isWerewolf === true;

  const action = nightActions[lookupKey];
  if (!action || !isTeamNightAction(action)) {
    return {
      myNightTarget: undefined,
      myNightTargetConfirmed: false,
      ...(previousNightTargetId ? { previousNightTargetId } : {}),
      ...(isEffectiveWerewolf &&
      ts?.roleState?.evilEmpath?.revealedResult !== undefined
        ? { evilEmpathRevealedResult: ts.roleState.evilEmpath.revealedResult }
        : {}),
    };
  }

  const myVote = action.votes.find((v) => v.playerId === callerId);
  const playerById = new Map(game.players.map((p) => [p.id, p]));
  const aliveParticipantIds = getGroupPhasePlayerIds(
    game.roleAssignments,
    groupPhaseKey,
    deadPlayerIds,
  );

  const teamVotes = action.votes
    .filter((v) => aliveParticipantIds.includes(v.playerId))
    .map((v) => ({
      playerName: playerById.get(v.playerId)?.name ?? "Unknown",
      ...(v.skipped
        ? { skipped: true as const }
        : { targetPlayerId: v.targetPlayerId }),
    }));

  const aliveVotes = action.votes.filter((v) =>
    aliveParticipantIds.includes(v.playerId),
  );
  const allSkipped = aliveVotes.every((v) => v.skipped === true);
  const uniqueTargets = new Set(
    aliveVotes.filter((v) => !v.skipped).map((v) => v.targetPlayerId),
  );
  const allAgreed =
    aliveVotes.length === aliveParticipantIds.length &&
    (allSkipped || uniqueTargets.size === 1);

  return {
    myNightTarget: myVote?.skipped ? null : myVote?.targetPlayerId,
    myNightTargetConfirmed: action.confirmed ?? false,
    teamVotes,
    suggestedTargetId: action.suggestedTargetId,
    allAgreed,
    ...(previousNightTargetId ? { previousNightTargetId } : {}),
    ...(isEffectiveWerewolf &&
    ts?.roleState?.evilEmpath?.revealedResult !== undefined
      ? { evilEmpathRevealedResult: ts.roleState.evilEmpath.revealedResult }
      : {}),
  };
}

function extractGenericSoloState(
  game: Game,
  myRole: WerewolfRoleDefinition,
  nightActions: Record<string, AnyNightAction>,
  ts: WerewolfTurnState | undefined,
): Partial<WerewolfPlayerGameState> {
  const myAction = nightActions[myRole.id];
  if (!myAction || isTeamNightAction(myAction)) {
    const previousNightTargetId = myRole.preventRepeatTarget
      ? ts?.lastTargets?.[myRole.id]
      : undefined;
    const priestWardActive =
      myRole.id === WerewolfRole.Priest && hasPriestActiveWard(ts);
    return {
      myNightTarget: undefined,
      myNightTargetConfirmed: false,
      ...(previousNightTargetId ? { previousNightTargetId } : {}),
      ...(priestWardActive ? { priestWardActive } : {}),
    };
  }

  const previousNightTargetId = myRole.preventRepeatTarget
    ? ts?.lastTargets?.[myRole.id]
    : undefined;
  const priestWardActive =
    myRole.id === WerewolfRole.Priest && hasPriestActiveWard(ts);
  const mySecondNightTarget = myAction.secondTargetPlayerId ?? undefined;

  const result: Partial<WerewolfPlayerGameState> = {
    myNightTarget: myAction.skipped ? null : myAction.targetPlayerId,
    myNightTargetConfirmed: myAction.confirmed ?? false,
    ...(previousNightTargetId ? { previousNightTargetId } : {}),
    ...(priestWardActive ? { priestWardActive } : {}),
    ...(mySecondNightTarget ? { mySecondNightTarget } : {}),
  };

  // Investigation results.
  if (
    myRole.targetCategory === TargetCategory.Investigate &&
    myAction.confirmed &&
    myAction.resultRevealed &&
    myAction.targetPlayerId
  ) {
    appendInvestigationResult(result, game, myRole, myAction, ts);
  }

  return result;
}
