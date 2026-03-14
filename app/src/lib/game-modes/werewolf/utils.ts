import { GameStatus } from "@/lib/types";
import type { Game, PlayerRoleAssignment } from "@/lib/types";
import { WakesAtNight, TargetCategory, WerewolfPhase } from "./types";
import type {
  TargetablePlayer,
  WerewolfNighttimePhase,
  WerewolfTurnState,
} from "./types";
import { WEREWOLF_ROLES } from "./roles";
import type { WerewolfRoleDefinition } from "./roles";

/**
 * Returns the list of players eligible to be targeted during a night phase.
 * Excludes the game owner (narrator) and dead players.
 */
export function getTargetablePlayers(
  players: TargetablePlayer[],
  ownerPlayerId: string | undefined,
  deadPlayerIds: string[],
): TargetablePlayer[] {
  return players.filter((p) => {
    if (p.id === ownerPlayerId) return false;
    if (deadPlayerIds.includes(p.id)) return false;
    return true;
  });
}

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

export interface ActiveNightPlayer {
  phase: WerewolfNighttimePhase;
  activeRoleId: string;
}

/**
 * Validates that the game is in a nighttime phase (after turn 1) and that the
 * caller is the player assigned to the currently active night role.
 * Returns the nighttime phase and active role ID on success, or undefined if
 * validation fails.
 */
export function validateActiveNightPlayer(
  game: Game,
  callerId: string,
): ActiveNightPlayer | undefined {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== WerewolfPhase.Nighttime) return undefined;
  if (ts.turn <= 1) return undefined;

  const phase = ts.phase;
  const callerAssignment = game.roleAssignments.find(
    (a) => a.playerId === callerId,
  );
  if (!callerAssignment) return undefined;

  const activeRoleId = phase.nightPhaseOrder[phase.currentPhaseIndex];
  if (callerAssignment.roleDefinitionId !== activeRoleId) return undefined;

  return { phase, activeRoleId };
}

/**
 * Returns the confirm button label for a given role ID based on its target category.
 * Attack → "Attack", Protect → "Protect", Investigate → "Investigate".
 * Special and None fall back to "Confirm".
 */
export function getConfirmLabel(roleId: string | undefined): string {
  if (!roleId) return "Confirm";
  const roleDef = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
    roleId
  ];
  if (!roleDef) return "Confirm";
  switch (roleDef.targetCategory) {
    case TargetCategory.Attack:
      return "Attack";
    case TargetCategory.Protect:
      return "Protect";
    case TargetCategory.Investigate:
      return "Investigate";
    default:
      return "Confirm";
  }
}
