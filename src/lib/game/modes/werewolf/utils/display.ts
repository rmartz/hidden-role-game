import { Team } from "@/lib/types";
import { TargetCategory } from "../types";
import type { AnyNightAction } from "../types";
import { WerewolfRole, getWerewolfRole } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";
import { WEREWOLF_COPY } from "../copy";
import { isGroupPhaseKey, baseGroupPhaseKey, isRoleActive } from "./phase-keys";
import { SMITE_PHASE_KEY, OLD_MAN_TIMER_KEY } from "./resolution";
import type { PhaseKey } from "./phase-keys";
import { targetPlayerIdOf } from "./targeting";
import { getPlayerName } from "@/lib/player";
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
  if (phaseKey === SMITE_PHASE_KEY) return "Narrator";
  if (phaseKey === OLD_MAN_TIMER_KEY) return "Old Man (role timer)";
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
    const roleDef = getWerewolfRole(myRole.id);
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

export interface InvestigationResultForNarrator {
  targetName: string;
  isWerewolfTeam: boolean;
  /** Custom label overriding the default "is/is not a Werewolf" display. */
  resultLabel?: string;
  /** For Mentalist: the second target's player name. */
  secondTargetName?: string;
  /**
   * When the Illusion Artist has flipped this target's alignment, contains the
   * annotation text showing the true (unflipped) alignment for the narrator.
   */
  illusionFlipLabel?: string;
}

/**
 * Computes the narrator's view of an investigation result.
 * Returns the target name and alignment (plus optional custom label), or
 * undefined if conditions aren't met.
 * Pass `activeRoleDef` to compute role-specific results (Wizard, Mystic Seer, Mentalist).
 * Pass `illusionTargetId` to apply Illusion Artist inversion: when the active target
 * matches the illusion target, the result is flipped and an annotation is included.
 */
export function getInvestigationResultForNarrator(
  isInvestigatePhase: boolean,
  activeTarget: string | undefined,
  activeTargetConfirmed: boolean | undefined,
  activeTargetName: string | undefined,
  visibleRoleAssignments: VisibleTeammate[],
  activeRoleDef?: WerewolfRoleDefinition,
  secondTargetId?: string,
  secondTargetName?: string,
  illusionTargetId?: string,
): InvestigationResultForNarrator | undefined {
  if (!isInvestigatePhase || !activeTarget || !activeTargetConfirmed)
    return undefined;
  const targetAssignment = visibleRoleAssignments.find(
    (a) => a.player.id === activeTarget,
  );
  if (!targetAssignment?.role) return undefined;
  const roleDef = getWerewolfRole(targetAssignment.role.id);

  if (activeRoleDef?.checksForSeer) {
    const isSeer = targetAssignment.role.id === (WerewolfRole.Seer as string);
    return {
      targetName: activeTargetName ?? activeTarget,
      isWerewolfTeam: isSeer,
      resultLabel: isSeer
        ? WEREWOLF_COPY.wizard.isSeer
        : WEREWOLF_COPY.wizard.isNotSeer,
    };
  }

  if (activeRoleDef?.revealsExactRole) {
    return {
      targetName: activeTargetName ?? activeTarget,
      isWerewolfTeam: roleDef?.isWerewolf === true,
      resultLabel: targetAssignment.role.name,
    };
  }

  if (activeRoleDef?.dualTargetInvestigate && secondTargetId) {
    const secondAssignment = visibleRoleAssignments.find(
      (a) => a.player.id === secondTargetId,
    );
    if (!secondAssignment?.role) return undefined;
    const secondRoleDef = getWerewolfRole(secondAssignment.role.id);
    // Neutral players win individually, so treat them as never sharing a team.
    const sameTeam =
      roleDef?.team !== Team.Neutral &&
      secondRoleDef?.team !== Team.Neutral &&
      roleDef?.team === secondRoleDef?.team;
    return {
      targetName: activeTargetName ?? activeTarget,
      isWerewolfTeam: sameTeam,
      resultLabel: sameTeam
        ? WEREWOLF_COPY.narrator.mentalistSameTeam
        : WEREWOLF_COPY.narrator.mentalistDifferentTeams,
      secondTargetName: secondTargetName ?? secondTargetId,
    };
  }

  const isWerewolf = roleDef?.isWerewolf === true;
  // Illusion Artist inversion only applies when the Seer is the active
  // investigator — other roles (One-Eyed Seer, etc.) always show true alignment.
  const isSeerInvestigation = activeRoleDef?.id === WerewolfRole.Seer;
  const isFlipped = isSeerInvestigation && illusionTargetId === activeTarget;
  return {
    targetName: activeTargetName ?? activeTarget,
    isWerewolfTeam: isFlipped ? !isWerewolf : isWerewolf,
    ...(isFlipped
      ? {
          illusionFlipLabel:
            WEREWOLF_COPY.illusionArtist.narratorFlipAnnotation(
              WEREWOLF_COPY.narrator.teamStatus(isWerewolf),
            ),
        }
      : {}),
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
  mirrorcasterCharged?: boolean,
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
  if (isRoleActive(phaseKey, WerewolfRole.Mirrorcaster)) {
    return mirrorcasterCharged ? "Attack" : "Protect";
  }
  const roleDef = getWerewolfRole(phaseKey);
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
