import type { Game, GameAction, PlayerRoleAssignment } from "@/lib/types";
import { getNightContext } from "./helpers";
import type { ClocktowerNightPhase, ClocktowerTurnState } from "../types";
import { ClocktowerRole } from "../roles";

/**
 * Determines who the Imp kills this night, accounting for:
 * - Monk protection (the Monk's target is immune to the Demon)
 * - Soldier immunity (a Soldier cannot be killed by the Demon)
 * - Imp self-kill (handled separately — triggers Minion succession)
 *
 * Returns the player ID to kill, or undefined if the kill is blocked.
 */
function resolveImpKill(
  ts: ClocktowerTurnState,
  phase: ClocktowerNightPhase,
  roleAssignments: readonly PlayerRoleAssignment[],
): string | undefined {
  const impAction = phase.nightActions[ClocktowerRole.Imp];
  if (!impAction?.targetPlayerId) return undefined;

  const target = impAction.targetPlayerId;

  // Imp self-kill is not a regular kill — handled via succession.
  if (target === ts.demonPlayerId) return undefined;

  // Monk protection: the Monk's target is safe from the Demon.
  const monkAction = phase.nightActions[ClocktowerRole.Monk];
  if (monkAction?.targetPlayerId === target) return undefined;

  // Soldier immunity: a Soldier cannot be killed by the Demon.
  const soldierAssignment = roleAssignments.find(
    (a) => a.roleDefinitionId === (ClocktowerRole.Soldier as string),
  );
  if (soldierAssignment?.playerId === target) return undefined;

  return target;
}

const MINION_ROLES: readonly string[] = [
  ClocktowerRole.Baron,
  ClocktowerRole.Poisoner,
  ClocktowerRole.ScarletWoman,
  ClocktowerRole.Spy,
];

/**
 * Resolves Imp self-kill succession. Returns the new Demon player ID.
 *
 * Priority:
 * 1. Scarlet Woman — triggers when 5+ players are alive at the time of death.
 * 2. First living Minion in role-assignment order (Storyteller's choice
 *    is not modelled here; the first is used as a default).
 *
 * Returns undefined if no living Minion is available.
 */
function resolveSuccession(
  ts: ClocktowerTurnState,
  roleAssignments: readonly PlayerRoleAssignment[],
  aliveCountBeforeDeath: number,
): string | undefined {
  const scarletWoman = roleAssignments.find(
    (a) => a.roleDefinitionId === (ClocktowerRole.ScarletWoman as string),
  );
  if (
    aliveCountBeforeDeath >= 5 &&
    scarletWoman &&
    !ts.deadPlayerIds.includes(scarletWoman.playerId)
  ) {
    return scarletWoman.playerId;
  }

  return roleAssignments.find(
    (a) =>
      MINION_ROLES.includes(a.roleDefinitionId) &&
      !ts.deadPlayerIds.includes(a.playerId),
  )?.playerId;
}

/**
 * `resolve-night`
 *
 * Storyteller-only action. Resolves all kill mechanics at the end of the
 * night phase:
 * 1. Determines who the Imp kills (accounting for Monk protection and Soldier
 *    immunity).
 * 2. If the Imp targets themselves and a living Minion exists, transfers the
 *    Demon role to that Minion (Scarlet Woman succession applies when 5+
 *    players are alive before the Imp dies).
 * 3. Adds killed players to `deadPlayerIds`.
 * 4. Updates `poisonedPlayerId` from the Poisoner's action.
 * 5. Advances `currentActionIndex` by 1 so information roles can wake next.
 *
 * Payload: none (empty object `{}`)
 *
 * Note: On-death abilities (e.g. Ravenkeeper) are triggered via subsequent
 * `set-night-target` and `provide-information` actions.
 */
export const resolveNightAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (callerId !== game.ownerPlayerId) return false;
    return getNightContext(game) !== undefined;
  },

  apply(game: Game) {
    const ctx = getNightContext(game);
    if (!ctx) return;
    const { ts, phase } = ctx;

    const impTarget = phase.nightActions[ClocktowerRole.Imp]?.targetPlayerId;
    const isImpSelfKill = impTarget === ts.demonPlayerId;

    if (isImpSelfKill) {
      // Count alive players before adding the Imp to the dead list.
      const aliveCount = game.players.filter(
        (p) => !ts.deadPlayerIds.includes(p.id),
      ).length;

      if (!ts.deadPlayerIds.includes(ts.demonPlayerId)) {
        ts.deadPlayerIds.push(ts.demonPlayerId);
      }

      const newDemon = resolveSuccession(ts, game.roleAssignments, aliveCount);
      if (newDemon) ts.demonPlayerId = newDemon;
    } else {
      const killed = resolveImpKill(ts, phase, game.roleAssignments);
      if (killed && !ts.deadPlayerIds.includes(killed)) {
        ts.deadPlayerIds.push(killed);
      }
    }

    // Update Poisoner state for the coming day.
    const poisonerTarget =
      phase.nightActions[ClocktowerRole.Poisoner]?.targetPlayerId;
    if (poisonerTarget) {
      ts.poisonedPlayerId = poisonerTarget;
    } else if (!phase.nightActions[ClocktowerRole.Poisoner]) {
      ts.poisonedPlayerId = undefined;
    }

    // Advance past the kill step so information roles can wake.
    phase.currentActionIndex += 1;
  },
};
