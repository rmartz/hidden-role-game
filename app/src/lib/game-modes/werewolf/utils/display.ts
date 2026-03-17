import { TargetCategory } from "../types";
import type { AnyNightAction } from "../types";
import { WEREWOLF_ROLES, WerewolfRole } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";
import { isGroupPhaseKey, baseGroupPhaseKey, isRoleActive } from "./phase-keys";
import type { PhaseKey } from "./phase-keys";
import { targetPlayerIdOf } from "./targeting";
import { getPlayerName } from "@/lib/player-utils";
import { Team } from "@/lib/types";
import type { NightStatusEntry, VisibleTeammate } from "@/server/types";

export type { PhaseKey };

export interface NightSummaryEntry {
  targetId: string;
  playerName: string;
  labels: string[];
}

/**
 * Builds a grouped summary of night actions: one entry per targeted player,
 * listing which phase keys targeted them. Phases with no target are omitted.
 */
export function buildNightSummary(
  nightActions: Record<string, AnyNightAction>,
  players: { id: string; name: string }[],
  roles: Record<string, { name: string }>,
): NightSummaryEntry[] {
  return Object.entries(nightActions)
    .flatMap(([phaseKey, a]) => {
      const targetId = targetPlayerIdOf(a);
      return targetId
        ? [{ targetId, label: getPhaseLabel(phaseKey, roles) }]
        : [];
    })
    .reduce<NightSummaryEntry[]>((acc, { targetId, label }) => {
      const existing = acc.find((e) => e.targetId === targetId);
      if (existing) {
        existing.labels.push(label);
      } else {
        const playerName = getPlayerName(players, targetId) ?? targetId;
        acc.push({ targetId, playerName, labels: [label] });
      }
      return acc;
    }, []);
}

/** Returns a human-readable label for a night phase key. */
export function getPhaseLabel(
  phaseKey: string,
  roles: Record<string, { name: string }>,
): string {
  return roles[baseGroupPhaseKey(phaseKey)]?.name ?? phaseKey;
}

/**
 * Returns true if the current night phase is this player's turn.
 * Group phases match if the player is the primary role or has wakesWith pointing to it.
 * Handles suffixed repeat phase keys (e.g. "werewolf-werewolf:2").
 * Solo phases match by exact role ID.
 */
export function isPlayersTurn(
  myRole?: { id: string },
  activePhaseKey?: string,
): boolean {
  if (!myRole || !activePhaseKey) return false;
  if (isGroupPhaseKey(activePhaseKey)) {
    const baseKey = baseGroupPhaseKey(activePhaseKey);
    if (myRole.id === baseKey) return true;
    const roleDef = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
      myRole.id
    ];
    return (roleDef?.wakesWith as string | undefined) === baseKey;
  }
  return myRole.id === activePhaseKey;
}

/**
 * Returns a human-readable confirmation string for a player's own night action.
 * For Attack category, appends a note when the target survived (was protected).
 */
export function getActionText(
  category: TargetCategory,
  targetName: string,
  nightStatus: NightStatusEntry[] | undefined,
  targetPlayerId: string,
): string {
  switch (category) {
    case TargetCategory.Protect:
      return `You Protected ${targetName}.`;
    case TargetCategory.Investigate:
      return `You Investigated ${targetName}.`;
    case TargetCategory.Attack: {
      const targetWasKilled = (nightStatus ?? []).some(
        (e) => e.effect === "killed" && e.targetPlayerId === targetPlayerId,
      );
      return targetWasKilled
        ? `You Attacked ${targetName}.`
        : `You Attacked ${targetName}, but it had no effect.`;
    }
    default:
      return `You targeted ${targetName}.`;
  }
}

/**
 * Computes the narrator's view of an investigation result.
 * Returns the target name and alignment, or undefined if conditions aren't met.
 */
export function getInvestigationResultForNarrator(
  isInvestigatePhase: boolean,
  activeTarget: string | undefined,
  activeTargetConfirmed: boolean | undefined,
  activeTargetName: string | undefined,
  visibleRoleAssignments: VisibleTeammate[],
): { targetName: string; isWerewolfTeam: boolean } | undefined {
  if (!isInvestigatePhase || !activeTarget || !activeTargetConfirmed)
    return undefined;
  const targetAssignment = visibleRoleAssignments.find(
    (a) => a.player.id === activeTarget,
  );
  if (!targetAssignment) return undefined;
  return {
    targetName: activeTargetName ?? activeTarget,
    isWerewolfTeam: targetAssignment.role.team === Team.Bad,
  };
}

export interface WitchConfirmContext {
  selectedTargetId: string | undefined;
  attackedPlayerIds: string[];
}

/**
 * Returns the confirm button label for a given phase key based on its target category.
 * Group phase keys return "Attack". Solo roles: Attack, Protect, Investigate,
 * Silence (Spellcaster), or "Confirm".
 * For the Witch: "Protect" if the selected target is under attack, "Attack" if not,
 * or "Use Ability" when no target is selected.
 */
export function getConfirmLabel(
  phaseKey?: PhaseKey,
  witchContext?: WitchConfirmContext,
): string {
  if (!phaseKey) return "Confirm";
  if (isGroupPhaseKey(phaseKey)) return "Attack";
  if (isRoleActive(phaseKey, WerewolfRole.Witch)) {
    if (!witchContext?.selectedTargetId) return "Use Ability";
    return witchContext.attackedPlayerIds.includes(
      witchContext.selectedTargetId,
    )
      ? "Protect"
      : "Attack";
  }
  if (isRoleActive(phaseKey, WerewolfRole.Spellcaster)) return "Silence";
  const roleDef = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
    phaseKey
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
