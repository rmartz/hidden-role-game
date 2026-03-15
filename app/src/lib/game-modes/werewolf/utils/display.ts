import { TargetCategory } from "../types";
import type { AnyNightAction } from "../types";
import { WEREWOLF_ROLES } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";
import { isTeamPhaseKey, TEAM_PHASE_PREFIX } from "./phase-keys";
import { targetPlayerIdOf } from "./targeting";
import { getPlayerName } from "@/lib/player-utils";

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
  teamLabels?: Partial<Record<string, string>>,
): string {
  if (isTeamPhaseKey(phaseKey)) {
    const team = phaseKey.slice(TEAM_PHASE_PREFIX.length);
    return teamLabels?.[team] ?? `${team} Team`;
  }
  return roles[phaseKey]?.name ?? phaseKey;
}

/**
 * Returns true if the current night phase is this player's turn.
 * Team phases match by team name; solo phases match by role ID.
 */
export function isPlayersTurn(
  myRole: { id: string; team: string } | undefined,
  activePhaseKey: string | undefined,
): boolean {
  if (!myRole || !activePhaseKey) return false;
  if (isTeamPhaseKey(activePhaseKey)) {
    return myRole.team === activePhaseKey.slice(TEAM_PHASE_PREFIX.length);
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
  nightSummary: { targetPlayerId: string; died: boolean }[] | undefined,
  targetPlayerId: string,
): string {
  switch (category) {
    case TargetCategory.Protect:
      return `You Protected ${targetName}.`;
    case TargetCategory.Investigate:
      return `You Investigated ${targetName}.`;
    case TargetCategory.Attack: {
      const targetWasKilled = (nightSummary ?? []).some(
        (e) => e.died && e.targetPlayerId === targetPlayerId,
      );
      return targetWasKilled
        ? `You Attacked ${targetName}.`
        : `You Attacked ${targetName}, but something protected them.`;
    }
    default:
      return `You targeted ${targetName}.`;
  }
}

/**
 * Returns the confirm button label for a given phase key based on its target category.
 * Team phase keys return "Attack". Solo roles: Attack, Protect, Investigate, or "Confirm".
 */
export function getConfirmLabel(phaseKey: string | undefined): string {
  if (!phaseKey) return "Confirm";
  if (isTeamPhaseKey(phaseKey)) return "Attack";
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
