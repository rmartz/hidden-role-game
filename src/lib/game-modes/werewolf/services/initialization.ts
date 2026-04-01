import { Team } from "@/lib/types";
import type { PlayerRoleAssignment } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState, WerewolfNighttimePhase } from "../types";
import { buildNightPhaseOrder } from "../utils";
import { WEREWOLF_ROLES, WerewolfRole } from "../roles";

/**
 * Selects the Executioner's target from the Good team players.
 * Returns undefined if no Executioner is in the game or no valid targets exist.
 */
export function selectExecutionerTarget(
  roleAssignments: PlayerRoleAssignment[],
): string | undefined {
  const rolesLookup = WEREWOLF_ROLES as Record<
    string,
    (typeof WEREWOLF_ROLES)[WerewolfRole] | undefined
  >;

  const executionerAssignment = roleAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.Executioner as string),
  );
  if (!executionerAssignment) return undefined;

  const goodCandidates = roleAssignments.filter((a) => {
    if (a.playerId === executionerAssignment.playerId) return false;
    const role = rolesLookup[a.roleDefinitionId];
    return role?.team === Team.Good;
  });
  if (goodCandidates.length === 0) return undefined;

  const randomIndex = Math.floor(Math.random() * goodCandidates.length);
  return goodCandidates[randomIndex]?.playerId;
}

/**
 * Builds the initial Werewolf turn state when a game transitions from
 * Starting to Playing.
 */
export function buildInitialTurnState(
  roleAssignments: PlayerRoleAssignment[],
  options?: Record<string, unknown>,
): WerewolfTurnState {
  const executionerTargetId = options?.["executionerTargetId"] as
    | string
    | undefined;
  const nightPhaseOrder = buildNightPhaseOrder(1, roleAssignments);
  const phase: WerewolfNighttimePhase = {
    type: WerewolfPhase.Nighttime,
    startedAt: Date.now(),
    nightPhaseOrder,
    currentPhaseIndex: 0,
    nightActions: {},
  };

  return {
    turn: 1,
    phase,
    deadPlayerIds: [],
    ...(executionerTargetId ? { executionerTargetId } : {}),
  };
}
