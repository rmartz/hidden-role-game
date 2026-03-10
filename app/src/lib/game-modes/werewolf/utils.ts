import { GameStatus } from "@/lib/models";
import type { Game, PlayerRoleAssignment } from "@/lib/models";
import { WakesAtNight, WEREWOLF_ROLES } from "./roles";
import type { WerewolfTurnState } from "./roles";

/**
 * Returns the ordered list of role IDs that wake during a Werewolf night phase.
 * On turn 1, includes first-night-only roles; subsequent turns exclude them.
 * Only includes roles that are actually assigned in the current game.
 */
export function buildNightPhaseOrder(
  turn: number,
  roleAssignments: PlayerRoleAssignment[],
): string[] {
  const assignedRoleIds = new Set(
    roleAssignments.map((a) => a.roleDefinitionId),
  );
  return Object.values(WEREWOLF_ROLES)
    .filter((role) => {
      if (!assignedRoleIds.has(role.id)) return false;
      if (role.wakesAtNight === WakesAtNight.EveryNight) return true;
      if (role.wakesAtNight === WakesAtNight.FirstNightOnly) return turn === 1;
      return false;
    })
    .map((role) => role.id);
}

export function isOwnerPlaying(game: Game, callerId: string): boolean {
  return (
    callerId === game.ownerPlayerId && game.status.type === GameStatus.Playing
  );
}

export function currentTurnState(game: Game): WerewolfTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as WerewolfTurnState | undefined;
}
