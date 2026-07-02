import type { Game } from "@/lib/types";

import type { WerewolfPlayerGameState } from "../player-state";
import { getWerewolfRole, WerewolfRole } from "../roles";
import type { AnyNightAction, WerewolfTurnState } from "../types";
import { isTeamNightAction } from "../types";

/**
 * Returns the player IDs immediately adjacent to `playerId` in the given
 * seating order. Returns up to two IDs (left and right neighbours), wrapping
 * around the ends of the list. If the player is not found, returns [].
 */
export function getAdjacentPlayerIds(
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
export function getNeighborIds(
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

export function extractTheThingState(
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
    ...(ts?.roleState?.theThing?.tapped === callerId
      ? { thingTappedMe: true }
      : {}),
    ...(soloAction?.confirmed && soloAction.targetPlayerId
      ? { thingTappedPlayerId: soloAction.targetPlayerId }
      : {}),
  };
}

export function extractInsomniacState(
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
    // alerted: true (Veteran alert action) counts as acting even though it
    // has no targetPlayerId.
    return (
      !action.skipped &&
      (action.targetPlayerId !== undefined || action.alerted === true)
    );
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

export function extractCountState(
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
