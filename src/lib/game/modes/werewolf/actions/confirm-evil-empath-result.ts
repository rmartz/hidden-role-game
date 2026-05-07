import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { WerewolfRole, getWerewolfRole } from "../roles";

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
    return !phase.nightActions[activePhaseKey]?.confirmed;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return;
    const phase = ts.phase;
    const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
    if (!activePhaseKey) return;

    // Auto-compute adjacency from seating order.
    const isAdjacent = computeSeerAdjacentToWerewolf(game, ts.deadPlayerIds);

    phase.nightActions[activePhaseKey] = {
      confirmed: true,
      resultRevealed: true,
    };
    ts.evilEmpathLastResult = isAdjacent;
  },
};

/**
 * Returns true if the Seer is seated immediately adjacent (one seat left or right,
 * wrapping around) to any living Werewolf player, using game.playerOrder as seating.
 * Returns false if seating order is unavailable or if either role is dead.
 */
function computeSeerAdjacentToWerewolf(
  game: Game,
  deadPlayerIds: string[],
): boolean {
  const playerOrder = game.playerOrder;
  if (!playerOrder || playerOrder.length < 2) return false;

  const seerAssignment = game.roleAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.Seer as string),
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
    const roleDef = getWerewolfRole(a.roleDefinitionId);
    return roleDef?.isWerewolf === true;
  });
}
