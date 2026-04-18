import { Team } from "@/lib/types";
import type { Game } from "@/lib/types";
import type { NighttimeNightStatusEntry } from "@/server/types";
import type { WerewolfPlayerGameState } from "../player-state";
import {
  currentTurnState,
  getGroupPhasePlayerIds,
  getInterimAttackedPlayerIds,
  baseGroupPhaseKey,
} from "../utils";
import { WerewolfPhase, TargetCategory, isTeamNightAction } from "../types";
import type { AnyNightAction, WerewolfTurnState } from "../types";
import type { WerewolfRoleDefinition } from "../roles";
import { WerewolfRole, getWerewolfRole } from "../roles";
import { WEREWOLF_COPY } from "../copy";

function hasPriestActiveWard(ts: WerewolfTurnState | undefined): boolean {
  if (!ts?.priestWards) return false;
  return Object.keys(ts.priestWards).some(
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

  // Tavern Keeper block: show blocked message, skip all other night state.
  if (ts?.tavernKeeperBlockedPlayerId === callerId) {
    return { tavernKeeperBlocked: true };
  }

  // Group phase handling.
  const groupPhaseKey = myRole.teamTargeting ? myRole.id : myRole.wakesWith;

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
    myRole,
    nightActions,
    deadPlayerIds,
    ts,
  );
  if (roleResult) return roleResult;

  // Generic solo action handling.
  return extractGenericSoloState(game, myRole, nightActions, ts);
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

  const action = nightActions[lookupKey];
  if (!action || !isTeamNightAction(action)) {
    return {
      myNightTarget: undefined,
      myNightTargetConfirmed: false,
      ...(previousNightTargetId ? { previousNightTargetId } : {}),
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
  };
}

function extractRoleSpecificState(
  game: Game,
  callerId: string,
  myRole: WerewolfRoleDefinition,
  nightActions: Record<string, AnyNightAction>,
  deadPlayerIds: string[],
  ts: WerewolfTurnState | undefined,
): Partial<WerewolfPlayerGameState> | undefined {
  if (myRole.id === WerewolfRole.Exposer) {
    const exposerAction = nightActions[myRole.id];
    const soloAction =
      exposerAction && !isTeamNightAction(exposerAction)
        ? exposerAction
        : undefined;
    return {
      myNightTarget: soloAction?.skipped ? null : soloAction?.targetPlayerId,
      myNightTargetConfirmed: soloAction?.confirmed ?? false,
      exposerAbilityUsed: ts?.exposerAbilityUsed ?? false,
    };
  }

  if (myRole.id === WerewolfRole.Mortician) {
    const morticianAction = nightActions[myRole.id];
    const soloAction =
      morticianAction && !isTeamNightAction(morticianAction)
        ? morticianAction
        : undefined;
    return {
      myNightTarget: soloAction?.skipped ? null : soloAction?.targetPlayerId,
      myNightTargetConfirmed: soloAction?.confirmed ?? false,
      morticianAbilityEnded: ts?.morticianAbilityEnded ?? false,
    };
  }

  if (myRole.id === WerewolfRole.Witch) {
    return extractWitchState(game, nightActions, myRole, deadPlayerIds, ts);
  }

  if (myRole.id === WerewolfRole.Altruist) {
    return extractAltruistState(
      game,
      callerId,
      nightActions,
      myRole,
      deadPlayerIds,
      ts,
    );
  }

  if (myRole.id === WerewolfRole.Mirrorcaster) {
    const mcAction = nightActions[myRole.id];
    const soloAction =
      mcAction && !isTeamNightAction(mcAction) ? mcAction : undefined;
    return {
      myNightTarget: soloAction?.skipped ? null : soloAction?.targetPlayerId,
      myNightTargetConfirmed: soloAction?.confirmed ?? false,
      mirrorcasterCharged: ts?.mirrorcasterCharged ?? false,
    };
  }

  if (myRole.id === WerewolfRole.Executioner) {
    return {
      myNightTarget: undefined,
      myNightTargetConfirmed: false,
      ...(ts?.executionerTargetId
        ? { executionerTargetId: ts.executionerTargetId }
        : {}),
    };
  }

  if (myRole.id === WerewolfRole.OneEyedSeer) {
    if (
      ts?.oneEyedSeerLockedTargetId &&
      !ts.deadPlayerIds.includes(ts.oneEyedSeerLockedTargetId)
    ) {
      return {
        myNightTarget: undefined,
        myNightTargetConfirmed: false,
        oneEyedSeerLockedTargetId: ts.oneEyedSeerLockedTargetId,
      };
    }
  }

  if (myRole.id === WerewolfRole.ElusiveSeer) {
    if (ts?.turn === 1) {
      const elusiveSeerVillagerIds = game.roleAssignments
        .filter((a) => a.roleDefinitionId === (WerewolfRole.Villager as string))
        .map((a) => a.playerId);
      return {
        myNightTarget: undefined,
        myNightTargetConfirmed: false,
        elusiveSeerVillagerIds,
      };
    }
  }

  return undefined;
}
function extractWitchState(
  game: Game,
  nightActions: Record<string, AnyNightAction>,
  myRole: WerewolfRoleDefinition,
  deadPlayerIds: string[],
  ts: WerewolfTurnState | undefined,
): Partial<WerewolfPlayerGameState> {
  const witchAction = nightActions[myRole.id];
  const soloAction =
    witchAction && !isTeamNightAction(witchAction) ? witchAction : undefined;
  const result: Partial<WerewolfPlayerGameState> = {
    myNightTarget: soloAction?.skipped ? null : soloAction?.targetPlayerId,
    myNightTargetConfirmed: soloAction?.confirmed ?? false,
    witchAbilityUsed: ts?.witchAbilityUsed ?? false,
  };
  if (!ts?.witchAbilityUsed) {
    const attacked = getInterimAttackedPlayerIds(
      nightActions,
      game.roleAssignments,
      deadPlayerIds,
      ts?.priestWards,
      ts?.mirrorcasterCharged,
    );
    if (attacked.length > 0) {
      result.nightStatus = attacked.map(
        (id): NighttimeNightStatusEntry => ({
          targetPlayerId: id,
          effect: "attacked",
        }),
      );
    }
  }
  return result;
}

function extractAltruistState(
  game: Game,
  callerId: string,
  nightActions: Record<string, AnyNightAction>,
  myRole: WerewolfRoleDefinition,
  deadPlayerIds: string[],
  ts: WerewolfTurnState | undefined,
): Partial<WerewolfPlayerGameState> {
  const altruistAction = nightActions[myRole.id];
  const soloAction =
    altruistAction && !isTeamNightAction(altruistAction)
      ? altruistAction
      : undefined;
  const witchAction = nightActions[WerewolfRole.Witch] as
    | { targetPlayerId?: string }
    | undefined;
  const witchProtectedId = witchAction?.targetPlayerId;
  const attacked = getInterimAttackedPlayerIds(
    nightActions,
    game.roleAssignments,
    deadPlayerIds,
    ts?.priestWards,
    ts?.mirrorcasterCharged,
  ).filter((id) => id !== callerId && id !== witchProtectedId);
  const result: Partial<WerewolfPlayerGameState> = {
    myNightTarget: soloAction?.skipped ? null : soloAction?.targetPlayerId,
    myNightTargetConfirmed: soloAction?.confirmed ?? false,
  };
  if (attacked.length > 0) {
    result.nightStatus = attacked.map(
      (id): NighttimeNightStatusEntry => ({
        targetPlayerId: id,
        effect: "attacked",
      }),
    );
  }
  return result;
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
    appendInvestigationResult(result, game, myRole, myAction);
  }

  return result;
}

function appendInvestigationResult(
  result: Partial<WerewolfPlayerGameState>,
  game: Game,
  myRoleDef: WerewolfRoleDefinition,
  myAction: { targetPlayerId: string; secondTargetPlayerId?: string },
): void {
  const targetAssignment = game.roleAssignments.find(
    (a) => a.playerId === myAction.targetPlayerId,
  );
  const targetRoleDef = targetAssignment
    ? getWerewolfRole(targetAssignment.roleDefinitionId)
    : undefined;

  if (myRoleDef.checksForSeer) {
    const isSeer = targetRoleDef?.id === WerewolfRole.Seer;
    result.investigationResult = {
      targetPlayerId: myAction.targetPlayerId,
      isWerewolfTeam: isSeer,
      resultLabel: isSeer
        ? WEREWOLF_COPY.wizard.isSeer
        : WEREWOLF_COPY.wizard.isNotSeer,
    };
  } else if (myRoleDef.revealsExactRole) {
    result.investigationResult = {
      targetPlayerId: myAction.targetPlayerId,
      isWerewolfTeam: targetRoleDef?.isWerewolf === true,
      resultLabel: targetRoleDef?.name ?? "Unknown",
    };
  } else if (myRoleDef.dualTargetInvestigate && myAction.secondTargetPlayerId) {
    const secondAssignment = game.roleAssignments.find(
      (a) => a.playerId === myAction.secondTargetPlayerId,
    );
    const secondRoleDef = secondAssignment
      ? getWerewolfRole(secondAssignment.roleDefinitionId)
      : undefined;
    const sameTeam =
      targetRoleDef?.team !== Team.Neutral &&
      secondRoleDef?.team !== Team.Neutral &&
      targetRoleDef?.team === secondRoleDef?.team;
    const playerById = new Map(game.players.map((p) => [p.id, p]));
    const secondName =
      playerById.get(myAction.secondTargetPlayerId)?.name ??
      myAction.secondTargetPlayerId;
    result.investigationResult = {
      targetPlayerId: myAction.targetPlayerId,
      isWerewolfTeam: sameTeam,
      resultLabel: sameTeam
        ? WEREWOLF_COPY.mentalist.sameTeam
        : WEREWOLF_COPY.mentalist.differentTeams,
      secondTargetName: secondName,
    };
  } else {
    result.investigationResult = {
      targetPlayerId: myAction.targetPlayerId,
      isWerewolfTeam: targetRoleDef?.isWerewolf === true,
    };
  }
}
