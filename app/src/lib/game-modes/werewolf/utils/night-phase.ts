import type { Game, PlayerRoleAssignment } from "@/lib/types";
import { WakesAtNight, WerewolfPhase } from "../types";
import type { WerewolfNighttimePhase } from "../types";
import { WEREWOLF_ROLES, WerewolfRole } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";
import { isGroupPhaseKey, baseGroupPhaseKey } from "./phase-keys";
import { currentTurnState } from "./game-state";

/**
 * Returns the ordered list of phase keys that wake during a Werewolf night.
 * Roles with `teamTargeting` use their own role ID as the phase key (group phase).
 * Roles with `wakesWith` are skipped — they join the referenced role's phase.
 * Phases where all relevant participants are dead are omitted.
 */
function hasAlivePlayers(
  roleId: string,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: Set<string>,
): boolean {
  return roleAssignments.some(
    (a) => a.roleDefinitionId === roleId && !deadPlayerIds.has(a.playerId),
  );
}

/**
 * Returns true if there are alive players who should participate in the given
 * group phase: either the primary role or any role with `wakesWith` pointing to it.
 */
function hasAliveGroupParticipants(
  phaseKey: string,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: Set<string>,
): boolean {
  const baseKey = baseGroupPhaseKey(phaseKey);
  return roleAssignments.some((a) => {
    if (deadPlayerIds.has(a.playerId)) return false;
    if (a.roleDefinitionId === baseKey) return true;
    const role = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
      a.roleDefinitionId
    ];
    return (role?.wakesWith as string | undefined) === baseKey;
  });
}

export function buildNightPhaseOrder(
  turn: number,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[] = [],
  extraGroupPhaseKeys: string[] = [],
): string[] {
  const dead = new Set(deadPlayerIds);
  const phaseKeys: string[] = [];
  const emittedGroupPhases = new Set<string>();

  let altruistPhaseKey: string | undefined;
  let witchPhaseKey: string | undefined;

  for (const role of Object.values(WEREWOLF_ROLES)) {
    if (role.wakesAtNight === WakesAtNight.Never) continue;
    if (role.wakesAtNight === WakesAtNight.FirstNightOnly && turn !== 1)
      continue;
    // Roles with wakesWith join another role's phase — skip them here.
    if (role.wakesWith) continue;

    if (role.teamTargeting) {
      if (emittedGroupPhases.has(role.id)) continue;
      if (!hasAliveGroupParticipants(role.id, roleAssignments, dead)) continue;
      emittedGroupPhases.add(role.id);
      phaseKeys.push(role.id);
    } else if (role.id === WerewolfRole.Altruist) {
      // Altruist acts after all other roles (sees unprotected targets) but before Witch.
      if (!hasAlivePlayers(role.id as string, roleAssignments, dead)) continue;
      altruistPhaseKey = role.id;
    } else if (role.id === WerewolfRole.Witch) {
      if (!hasAlivePlayers(role.id as string, roleAssignments, dead)) continue;
      witchPhaseKey = role.id;
    } else {
      if (!hasAlivePlayers(role.id as string, roleAssignments, dead)) continue;
      phaseKeys.push(role.id);
    }
  }

  // Extra group phase keys are inserted before the Altruist and Witch (e.g. Wolf Cub bonus phases).
  // Skip any extra phase where all group participants are dead.
  for (const key of extraGroupPhaseKeys) {
    if (!hasAliveGroupParticipants(key, roleAssignments, dead)) continue;
    phaseKeys.push(key);
  }

  // Altruist acts after other roles so they see only unprotected targets.
  if (altruistPhaseKey !== undefined) phaseKeys.push(altruistPhaseKey);
  // Witch always acts last — they need to see all prior attacks before choosing.
  if (witchPhaseKey !== undefined) phaseKeys.push(witchPhaseKey);

  return phaseKeys;
}

export interface ActiveNightPlayer {
  phase: WerewolfNighttimePhase;
  activePhaseKey: string;
  isGroupPhase: boolean;
}

/**
 * Validates that the game is in a nighttime phase (after turn 1) and that the
 * caller belongs to the currently active night phase — either matching the
 * active role ID (solo) or being a participant in a group phase
 * (primary role or wakesWith that role).
 * Returns the nighttime phase and active phase key on success, or undefined
 * if validation fails.
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

  const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
  if (!activePhaseKey) return undefined;

  if (isGroupPhaseKey(activePhaseKey)) {
    // Group phase — check caller is the primary role or a wakesWith participant.
    // Use the base key so suffixed repeat phases (e.g. ":2") match correctly.
    const baseKey = baseGroupPhaseKey(activePhaseKey);
    const callerRole = (
      WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>
    )[callerAssignment.roleDefinitionId];
    const isParticipant =
      (callerRole?.id as string | undefined) === baseKey ||
      (callerRole?.wakesWith as string | undefined) === baseKey;
    if (!isParticipant) return undefined;
    return { phase, activePhaseKey, isGroupPhase: true };
  }

  // Solo phase — exact role match.
  if (callerAssignment.roleDefinitionId !== activePhaseKey) return undefined;
  return { phase, activePhaseKey, isGroupPhase: false };
}
