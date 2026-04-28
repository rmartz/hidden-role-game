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

/**
 * Returns the player IDs immediately adjacent to `playerId` in the given
 * seating order. Returns up to two IDs (left and right neighbours), wrapping
 * around the ends of the list. If the player is not found, returns [].
 */
function getAdjacentPlayerIds(
  playerOrder: string[],
  playerId: string,
): string[] {
  const idx = playerOrder.indexOf(playerId);
  if (idx === -1 || playerOrder.length < 2) return [];
  const left = playerOrder[(idx - 1 + playerOrder.length) % playerOrder.length];
  const right = playerOrder[(idx + 1) % playerOrder.length];
  if (!left || !right) return [];
  if (left === right) return [left];
  return [left, right];
}

/**
 * Returns the ID of the left neighbor (seat before) and right neighbor
 * (seat after) for `playerId` in `playerOrder`. Returns undefined for either
 * if the player list is too short.
 */
function getNeighborIds(
  playerOrder: string[],
  playerId: string,
): { left: string | undefined; right: string | undefined } {
  const idx = playerOrder.indexOf(playerId);
  if (idx === -1 || playerOrder.length < 2) {
    return { left: undefined, right: undefined };
  }
  return {
    left: playerOrder[(idx - 1 + playerOrder.length) % playerOrder.length],
    right: playerOrder[(idx + 1) % playerOrder.length],
  };
}

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

  if (myRole.id === WerewolfRole.TheThing) {
    return extractTheThingState(game, callerId, nightActions, ts);
  }

  if (myRole.id === WerewolfRole.Insomniac) {
    return extractInsomniacState(game, callerId, nightActions);
  }

  if (myRole.id === WerewolfRole.Count) {
    return extractCountState(game, ts);
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

function extractTheThingState(
  game: Game,
  callerId: string,
  nightActions: Record<string, AnyNightAction>,
  ts: WerewolfTurnState | undefined,
): Partial<WerewolfPlayerGameState> {
  const thingAction = nightActions[WerewolfRole.TheThing];
  const soloAction =
    thingAction && !isTeamNightAction(thingAction) ? thingAction : undefined;
  const playerOrder = game.playerOrder ?? game.players.map((p) => p.id);
  const adjacentPlayerIds = getAdjacentPlayerIds(playerOrder, callerId);
  return {
    myNightTarget: soloAction?.skipped ? null : soloAction?.targetPlayerId,
    myNightTargetConfirmed: soloAction?.confirmed ?? false,
    ...(adjacentPlayerIds.length > 0 ? { adjacentPlayerIds } : {}),
    ...(ts?.thingTapped && ts.thingTapped === callerId
      ? { thingTappedMe: true }
      : {}),
    ...(soloAction?.confirmed && soloAction.targetPlayerId
      ? { thingTappedPlayerId: soloAction.targetPlayerId }
      : {}),
  };
}

function extractInsomniacState(
  game: Game,
  callerId: string,
  nightActions: Record<string, AnyNightAction>,
): Partial<WerewolfPlayerGameState> {
  const playerOrder = game.playerOrder ?? game.players.map((p) => p.id);
  const { left, right } = getNeighborIds(playerOrder, callerId);

  // Derive "woke and acted" purely from nightActions — nightPhaseOrder is empty
  // during Daytime, so we cannot use it here. Any non-skip entry in nightActions
  // for the neighbor's phase key means they woke and acted this night.
  const neighborActed = (neighborId: string | undefined): boolean => {
    if (!neighborId) return false;
    const assignment = game.roleAssignments.find(
      (a) => a.playerId === neighborId,
    );
    if (!assignment) return false;
    const roleDef = getWerewolfRole(assignment.roleDefinitionId);
    if (!roleDef) return false;
    // Roles that wake with another role use that role's phase key.
    const phaseKey = (roleDef.wakesWith ?? roleDef.id) as string;
    const action = nightActions[phaseKey];
    if (!action) return false;
    if (isTeamNightAction(action)) {
      // Group phase: check if the neighbor cast a non-skip vote.
      const vote = action.votes.find((v) => v.playerId === neighborId);
      return vote !== undefined && !vote.skipped;
    }
    return !action.skipped && action.targetPlayerId !== undefined;
  };

  return {
    myNightTarget: undefined,
    myNightTargetConfirmed: false,
    insomniacResult: {
      leftActed: neighborActed(left),
      rightActed: neighborActed(right),
    },
  };
}

function extractCountState(
  game: Game,
  ts: WerewolfTurnState | undefined,
): Partial<WerewolfPlayerGameState> {
  // The Count only acts on night 1.
  if (ts?.turn !== 1) {
    return {
      myNightTarget: undefined,
      myNightTargetConfirmed: false,
    };
  }

  const playerOrder = game.playerOrder ?? game.players.map((p) => p.id);
  // Exclude the narrator (ownerPlayerId) from the seating list.
  const seatOrder = playerOrder.filter((id) => id !== game.ownerPlayerId);
  const mid = Math.ceil(seatOrder.length / 2);
  const leftHalf = seatOrder.slice(0, mid);
  const rightHalf = seatOrder.slice(mid);

  const isWerewolfPlayer = (playerId: string): boolean => {
    const assignment = game.roleAssignments.find(
      (a) => a.playerId === playerId,
    );
    const roleDef = assignment
      ? getWerewolfRole(assignment.roleDefinitionId)
      : undefined;
    return roleDef?.isWerewolf === true;
  };

  return {
    myNightTarget: undefined,
    myNightTargetConfirmed: false,
    countResult: {
      leftCount: leftHalf.filter(isWerewolfPlayer).length,
      rightCount: rightHalf.filter(isWerewolfPlayer).length,
    },
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
