import type { Game, PlayerRoleAssignment } from "@/lib/types";
import { WakesAtNight, WerewolfPhase } from "../types";
import type { WerewolfNighttimePhase } from "../types";
import {
  WEREWOLF_ROLES,
  WerewolfRole,
  WerewolfRoleCategory,
  getWerewolfRole,
} from "../roles";
import { isGroupPhaseKey, baseGroupPhaseKey, isRoleActive } from "./phase-keys";
import { currentTurnState } from "./game-state";

/**
 * Defines the order in which role categories wake during the night phase.
 * Follows the rule: Bad team → Neutral team → Good team,
 * and within each team: Attack → Investigate → Protect → Special.
 * This is distinct from WEREWOLF_ROLE_CATEGORY_ORDER which is used for the UI.
 */
const NIGHT_PHASE_CATEGORY_ORDER: WerewolfRoleCategory[] = [
  WerewolfRoleCategory.EvilKilling,
  WerewolfRoleCategory.EvilSupport,
  WerewolfRoleCategory.NeutralKilling,
  WerewolfRoleCategory.NeutralManipulation,
  WerewolfRoleCategory.VillagerKilling,
  WerewolfRoleCategory.VillagerInvestigation,
  WerewolfRoleCategory.VillagerProtection,
  WerewolfRoleCategory.VillagerSupport,
  WerewolfRoleCategory.VillagerHandicap,
];

/**
 * Priority map built once at module load — avoids rebuilding on every call.
 * Categories absent from NIGHT_PHASE_CATEGORY_ORDER sort to the end (index = length).
 */
const NIGHT_PHASE_CATEGORY_PRIORITY = new Map(
  NIGHT_PHASE_CATEGORY_ORDER.map((cat, i) => [cat, i]),
);

if (process.env.NODE_ENV !== "production") {
  for (const role of Object.values(WEREWOLF_ROLES)) {
    if (!NIGHT_PHASE_CATEGORY_PRIORITY.has(role.category)) {
      console.warn(
        `night-phase: role "${role.id}" has category "${role.category}" not in NIGHT_PHASE_CATEGORY_ORDER — it will sort last`,
      );
    }
  }
}

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
    const role = getWerewolfRole(a.roleDefinitionId);
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
  let insomniacPhaseKey: string | undefined;

  const sortedRoles = Object.values(WEREWOLF_ROLES).sort((a, b) => {
    const aIdx =
      NIGHT_PHASE_CATEGORY_PRIORITY.get(a.category) ??
      NIGHT_PHASE_CATEGORY_ORDER.length;
    const bIdx =
      NIGHT_PHASE_CATEGORY_PRIORITY.get(b.category) ??
      NIGHT_PHASE_CATEGORY_ORDER.length;
    return aIdx - bIdx;
  });

  for (const role of sortedRoles) {
    if (role.wakesAtNight === WakesAtNight.Never) continue;
    if (role.wakesAtNight === WakesAtNight.FirstNightOnly && turn !== 1)
      continue;
    if (role.wakesAtNight === WakesAtNight.AfterFirstNight && turn <= 1)
      continue;
    // Roles with wakesWith join another role's phase — skip them here.
    if (role.wakesWith) continue;

    if (role.teamTargeting) {
      if (emittedGroupPhases.has(role.id)) continue;
      if (!hasAliveGroupParticipants(role.id, roleAssignments, dead)) continue;
      emittedGroupPhases.add(role.id);
      phaseKeys.push(role.id);
      // Insert any extra phases for this group consecutively, so both phases
      // for the same group (e.g. Wolf Cub bonus) are adjacent in the order.
      for (const key of extraGroupPhaseKeys) {
        if (!isRoleActive(baseGroupPhaseKey(key), role.id)) continue;
        if (!hasAliveGroupParticipants(key, roleAssignments, dead)) continue;
        phaseKeys.push(key);
      }
    } else if (role.id === WerewolfRole.Witch) {
      if (!hasAlivePlayers(role.id, roleAssignments, dead)) continue;
      witchPhaseKey = role.id;
    } else if (role.id === WerewolfRole.Altruist) {
      // Altruist acts last — after the Witch — so they only see players the Witch
      // didn't already protect.
      if (!hasAlivePlayers(role.id, roleAssignments, dead)) continue;
      altruistPhaseKey = role.id;
    } else if (role.id === WerewolfRole.Insomniac) {
      // Insomniac acts very last — after all other roles (including Altruist)
      // so they can query which neighbors woke and acted.
      if (!hasAlivePlayers(role.id as string, roleAssignments, dead)) continue;
      insomniacPhaseKey = role.id;
    } else {
      if (!hasAlivePlayers(role.id, roleAssignments, dead)) continue;
      phaseKeys.push(role.id);
    }
  }

  // Witch acts second-to-last — they need to see all prior attacks before choosing.
  if (witchPhaseKey !== undefined) phaseKeys.push(witchPhaseKey);
  // Altruist acts after the Witch — so they only see players still unprotected.
  if (altruistPhaseKey !== undefined) phaseKeys.push(altruistPhaseKey);
  // Insomniac acts absolutely last — after all other roles have acted — so they
  // can determine which neighbors woke and performed a non-skip action.
  if (insomniacPhaseKey !== undefined) phaseKeys.push(insomniacPhaseKey);

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
    const callerRole = getWerewolfRole(callerAssignment.roleDefinitionId);
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
