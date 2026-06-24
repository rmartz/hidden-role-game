import type { AnyNightAction } from "@/lib/game/modes/werewolf";
import {
  isGroupPhaseKey,
  isRoleActive,
  isTeamNightAction,
  TargetCategory,
} from "@/lib/game/modes/werewolf";
import { getWerewolfRole, WerewolfRole } from "@/lib/game/modes/werewolf/roles";

import { NightMarkerEffect } from "./NightActionMarker";

/**
 * Derives per-player night action status markers from the narrator's night actions.
 * A marker is added for any role action that has selected a target — including team
 * votes' `suggestedTargetId` and standing priest wards — regardless of whether the
 * action has been confirmed yet. Duplicate effects for the same player are deduped
 * so each effect appears at most once.
 */
export function buildNightMarkers(
  nightActions: Record<string, AnyNightAction>,
  priestWards?: Record<string, string>,
  mirrorcasterCharged?: boolean,
): Map<string, NightMarkerEffect[]> {
  const markerSets = new Map<string, Set<NightMarkerEffect>>();

  const addMarker = (playerId: string, effect: NightMarkerEffect) => {
    const existing = markerSets.get(playerId);
    if (existing) {
      existing.add(effect);
    } else {
      markerSets.set(playerId, new Set([effect]));
    }
  };

  for (const [phaseKey, action] of Object.entries(nightActions)) {
    const targetId = isTeamNightAction(action)
      ? action.suggestedTargetId
      : action.targetPlayerId;
    if (!targetId) continue;

    if (isGroupPhaseKey(phaseKey)) {
      addMarker(targetId, NightMarkerEffect.Attacked);
      continue;
    }

    if (isRoleActive(phaseKey, WerewolfRole.Spellcaster)) {
      addMarker(targetId, NightMarkerEffect.Silenced);
      continue;
    }

    if (isRoleActive(phaseKey, WerewolfRole.Mummy)) {
      addMarker(targetId, NightMarkerEffect.Hypnotized);
      continue;
    }

    if (isRoleActive(phaseKey, WerewolfRole.Mirrorcaster)) {
      addMarker(
        targetId,
        mirrorcasterCharged
          ? NightMarkerEffect.Attacked
          : NightMarkerEffect.Protected,
      );
      continue;
    }

    const roleDef = getWerewolfRole(phaseKey);
    if (!roleDef) continue;

    switch (roleDef.targetCategory) {
      case TargetCategory.Attack:
        addMarker(targetId, NightMarkerEffect.Attacked);
        break;
      case TargetCategory.Protect:
        addMarker(targetId, NightMarkerEffect.Protected);
        break;
      case TargetCategory.Investigate:
        addMarker(targetId, NightMarkerEffect.Investigated);
        break;
      default:
        addMarker(targetId, NightMarkerEffect.Special);
    }

    // Mentalist investigates two players; mark the second target as well.
    if (
      isRoleActive(phaseKey, WerewolfRole.Mentalist) &&
      !isTeamNightAction(action) &&
      action.secondTargetPlayerId
    ) {
      addMarker(action.secondTargetPlayerId, NightMarkerEffect.Investigated);
    }
  }

  // Priest wards: mark all warded players as Protected.
  for (const wardedPlayerId of Object.keys(priestWards ?? {})) {
    addMarker(wardedPlayerId, NightMarkerEffect.Protected);
  }

  const markers = new Map<string, NightMarkerEffect[]>();
  for (const [playerId, effects] of markerSets) {
    markers.set(playerId, [...effects].sort());
  }
  return markers;
}
