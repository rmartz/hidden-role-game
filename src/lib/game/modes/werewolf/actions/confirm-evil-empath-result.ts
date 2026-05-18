import type { Game, GameAction } from "@/lib/types";

import { getWerewolfRole, WerewolfRole } from "../roles";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";

/**
 * Confirms the Evil Empath adjacency result for this night.
 * The adjacency result is auto-computed from game.playerOrder (seating order):
 * the Evil Empath's ability fires when the Seer is seated immediately next to
 * any living Werewolf (isWerewolf).
 */
export const confirmEvilEmpathResultAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;
    const phase = ts.phase;
    const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
    if (activePhaseKey !== (WerewolfRole.EvilEmpath as string)) return false;
    // Allow recomputing if the action was confirmed via the generic flow
    // (confirmed but not resultRevealed — no adjacency result computed yet).
    const existingAction = phase.nightActions[activePhaseKey];
    const alreadyComputed =
      existingAction &&
      !("votes" in existingAction) &&
      existingAction.confirmed === true &&
      existingAction.resultRevealed === true;
    return !alreadyComputed;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return;
    const phase = ts.phase;
    const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
    if (!activePhaseKey) return;

    // Auto-compute adjacency from seating order.
    const isAdjacent = computeSeerAdjacentToWerewolf(
      game,
      ts.deadPlayerIds,
      ts.roleOverrides,
    );

    phase.nightActions[activePhaseKey] = {
      confirmed: true,
      resultRevealed: true,
    };
    ts.roleState = {
      ...ts.roleState,
      evilEmpath: {
        ...ts.roleState?.evilEmpath,
        lastResult: isAdjacent,
      },
    };
  },
};

/**
 * Returns true if the Seer is seated immediately adjacent (one seat left or right,
 * wrapping around) to any living Werewolf player, using game.playerOrder as seating.
 * The narrator (ownerPlayerId) is excluded from the ring so a player seated next
 * to the narrator still has two selectable neighbours, matching the pattern used
 * in set-night-target.ts and extractCountState.
 * Returns false if seating order is unavailable or if either role is dead.
 */
function computeSeerAdjacentToWerewolf(
  game: Game,
  deadPlayerIds: string[],
  roleOverrides?: Record<string, string>,
): boolean {
  const rawOrder = game.playerOrder;
  if (!rawOrder || rawOrder.length < 2) return false;
  // Exclude the narrator from the seating ring so their seat does not break
  // adjacency between players on either side.
  const playerOrder = rawOrder.filter((id) => id !== game.ownerPlayerId);
  if (playerOrder.length < 2) return false;

  // Resolve effective role for each player so we find the Seer even when
  // a roleOverride has assigned or removed the Seer role mid-game.
  const seerAssignment = game.roleAssignments.find(
    (a) =>
      (roleOverrides?.[a.playerId] ?? a.roleDefinitionId) ===
      (WerewolfRole.Seer as string),
  );
  if (!seerAssignment || deadPlayerIds.includes(seerAssignment.playerId))
    return false;

  const seerSeatIndex = playerOrder.indexOf(seerAssignment.playerId);
  if (seerSeatIndex === -1) return false;

  const len = playerOrder.length;
  const leftNeighbourId = playerOrder[(seerSeatIndex - 1 + len) % len];
  const rightNeighbourId = playerOrder[(seerSeatIndex + 1) % len];
  const neighbourIds = new Set([leftNeighbourId, rightNeighbourId]);

  return game.roleAssignments.some((a) => {
    if (!neighbourIds.has(a.playerId)) return false;
    if (deadPlayerIds.includes(a.playerId)) return false;
    const effectiveRoleId = roleOverrides?.[a.playerId] ?? a.roleDefinitionId;
    const roleDef = getWerewolfRole(effectiveRoleId);
    return roleDef?.isWerewolf === true;
  });
}
