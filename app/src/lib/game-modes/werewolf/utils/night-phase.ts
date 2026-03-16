import type { Game, PlayerRoleAssignment } from "@/lib/types";
import { WakesAtNight, WerewolfPhase } from "../types";
import type { WerewolfNighttimePhase } from "../types";
import { WEREWOLF_ROLES, WerewolfRole } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";
import { parseTeamPhaseKey, getTeamPhaseKey } from "./phase-keys";
import { currentTurnState } from "./game-state";

/**
 * Returns the ordered list of phase keys that wake during a Werewolf night.
 * Roles with `teamTargeting` on the same team are grouped into a single
 * team phase key (e.g. "team:Bad"). Solo roles use their role ID.
 * Phases where all relevant players are dead are omitted.
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

export function buildNightPhaseOrder(
  turn: number,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[] = [],
): string[] {
  const dead = new Set(deadPlayerIds);
  const phaseKeys: string[] = [];
  const emittedTeams = new Set<string>();

  let witchPhaseKey: string | undefined;

  for (const role of Object.values(WEREWOLF_ROLES)) {
    if (role.wakesAtNight === WakesAtNight.Never) continue;
    if (role.wakesAtNight === WakesAtNight.FirstNightOnly && turn !== 1)
      continue;
    if (!hasAlivePlayers(role.id as string, roleAssignments, dead)) continue;

    if (role.teamTargeting) {
      if (emittedTeams.has(role.team)) continue;
      emittedTeams.add(role.team);
      phaseKeys.push(getTeamPhaseKey(role.team));
    } else if (role.id === WerewolfRole.Witch) {
      witchPhaseKey = role.id;
    } else {
      phaseKeys.push(role.id);
    }
  }

  // Witch always acts last — she needs to see all prior attacks before choosing.
  if (witchPhaseKey !== undefined) phaseKeys.push(witchPhaseKey);

  return phaseKeys;
}

export interface ActiveNightPlayer {
  phase: WerewolfNighttimePhase;
  activePhaseKey: string;
  isTeamPhase: boolean;
}

/**
 * Validates that the game is in a nighttime phase (after turn 1) and that the
 * caller belongs to the currently active night phase — either matching the
 * active role ID (solo) or belonging to the active team (team phase).
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

  const team = parseTeamPhaseKey(activePhaseKey);
  if (team) {
    // Team phase — check caller's role is on this team with teamTargeting.
    const callerRole = (
      WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>
    )[callerAssignment.roleDefinitionId];
    if (!callerRole?.teamTargeting || callerRole.team !== team)
      return undefined;
    return { phase, activePhaseKey, isTeamPhase: true };
  }

  // Solo phase — exact role match.
  if (callerAssignment.roleDefinitionId !== activePhaseKey) return undefined;
  return { phase, activePhaseKey, isTeamPhase: false };
}
