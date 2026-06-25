import type { PlayerRoleAssignment } from "@/lib/types";

import { getWerewolfRole, WerewolfRole } from "../roles";
import type { AnyNightAction, NightAction } from "../types";
import {
  isTeamNightAction,
  TargetCategory,
  VeteranCounterkillSource,
} from "../types";
import { removeFromMapSet } from "./attack-map";
import { baseGroupPhaseKey, isGroupPhaseKey, isRoleActive } from "./phase-keys";

export interface PendingVeteranKill {
  counterkilledPlayerId: string;
  veteranPlayerId: string;
  source: VeteranCounterkillSource;
}

/**
 * Resolves Veteran counter-kills against the current attack/protection maps.
 *
 * Runs after the Altruist and Swapper so neither can intercept the counter-kills.
 * Mutates `attacks` and `protections` in place (repelling attacks on the Veteran
 * and queueing counter-kill attacks, plus any Priest wards on the new victims),
 * and returns the pending counter-kill entries. Events are emitted by the caller
 * after Tough Guy absorption so `died` reflects the actual outcome.
 */
export function collectVeteranCounterkills(
  nightActions: Record<string, AnyNightAction>,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
  attacks: Map<string, string[]>,
  protections: Map<string, string[]>,
  priestWards?: Record<string, string>,
  mercenaryCharged?: boolean,
): PendingVeteranKill[] {
  const pendingVeteranKills: PendingVeteranKill[] = [];

  const veteranAction = nightActions[WerewolfRole.Veteran];
  const veteranAlerted =
    veteranAction !== undefined &&
    !isTeamNightAction(veteranAction) &&
    veteranAction.alerted === true;
  if (!veteranAlerted) return pendingVeteranKills;

  const veteranPlayerId = roleAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.Veteran as string),
  )?.playerId;
  if (!veteranPlayerId) return pendingVeteranKills;

  // Werewolf attack repel: if a wolf group's attack is currently on the
  // Veteran (post-Swapper), remove it and counter-kill one alive wolf
  // participant instead. Iterating over the attacks map (rather than
  // nightActions.suggestedTargetId) ensures Swapper-redirected wolf
  // attacks are caught as well as directly-targeted ones.
  // Track already-selected victims so multiple wolf-group phases don't
  // select the same wolf when there are bonus attack keys (e.g. Wolf Cub).
  const selectedWolfVictimIds = new Set<string>();
  const wolfPhaseKeysOnVeteran = (attacks.get(veteranPlayerId) ?? []).filter(
    isGroupPhaseKey,
  );
  for (const phaseKey of wolfPhaseKeysOnVeteran) {
    // Remove this wolf-group's attack entry from the Veteran.
    removeFromMapSet(attacks, veteranPlayerId, phaseKey);

    // Find the first alive participant in this wolf group not already
    // selected as a victim this resolution pass.
    const baseKey = baseGroupPhaseKey(phaseKey);
    const wolfVictimId = roleAssignments.find((a) => {
      if (deadPlayerIds.includes(a.playerId)) return false;
      if (selectedWolfVictimIds.has(a.playerId)) return false;
      if (a.roleDefinitionId === baseKey) return true;
      const role = getWerewolfRole(a.roleDefinitionId);
      return (role?.wakesWith as string | undefined) === baseKey;
    })?.playerId;

    if (wolfVictimId) {
      selectedWolfVictimIds.add(wolfVictimId);
      attacks.set(wolfVictimId, [
        ...(attacks.get(wolfVictimId) ?? []),
        WerewolfRole.Veteran,
      ]);
      // If the wolf victim has an active Priest ward, apply the protection
      // now so the ward absorbs this newly-queued counter-kill attack.
      // (applyPriestWards ran before Veteran resolution and only covers
      // attacks that existed at that point.)
      if (priestWards?.[wolfVictimId]) {
        protections.set(wolfVictimId, [
          ...(protections.get(wolfVictimId) ?? []),
          WerewolfRole.Priest,
        ]);
      }
      pendingVeteranKills.push({
        counterkilledPlayerId: wolfVictimId,
        veteranPlayerId,
        source: VeteranCounterkillSource.WolfRepel,
      });
    }
  }

  // Visitor counter-kill: only Protect- and Attack-category solo roles
  // physically visit the Veteran; Investigation and Special roles (Seer,
  // Exposer, Spellcaster, Mummy, Dracula, Zombie, …) use mystical powers
  // or non-physical means and are not counter-killed.
  // Mirrorcaster is classified as Special but effectively acts as Protect
  // (uncharged) or Attack (charged) — treat it as a physical visitor.
  // Mercenary is classified as Special but acts as Protect when uncharged
  // (Protect mode) — treat it as a physical visitor in that mode.
  for (const [phaseKey, action] of Object.entries(nightActions)) {
    if (isGroupPhaseKey(phaseKey)) continue;
    if (isRoleActive(phaseKey, WerewolfRole.Priest)) continue;
    const soloAction = action as NightAction;
    if (soloAction.targetPlayerId !== veteranPlayerId) continue;
    const role = getWerewolfRole(phaseKey);
    if (
      role?.targetCategory !== TargetCategory.Protect &&
      role?.targetCategory !== TargetCategory.Attack &&
      !isRoleActive(phaseKey, WerewolfRole.Mirrorcaster) &&
      !(isRoleActive(phaseKey, WerewolfRole.Mercenary) && !mercenaryCharged)
    )
      continue;

    const visitorPlayerId = roleAssignments.find(
      (a) => a.roleDefinitionId === phaseKey,
    )?.playerId;
    if (!visitorPlayerId || deadPlayerIds.includes(visitorPlayerId)) continue;

    // Discard any protection the visitor provided to the Veteran.
    removeFromMapSet(protections, veteranPlayerId, phaseKey);

    // Remove any attack the visitor had on the Veteran (attack roles that
    // targeted the Veteran are repelled, not just protectors).
    removeFromMapSet(attacks, veteranPlayerId, phaseKey);

    // Queue the counter-kill attack.
    attacks.set(visitorPlayerId, [
      ...(attacks.get(visitorPlayerId) ?? []),
      WerewolfRole.Veteran,
    ]);
    // If the visitor has an active Priest ward, apply the protection now so
    // the ward absorbs this newly-queued counter-kill attack.
    // (applyPriestWards ran before Veteran resolution and only covers
    // attacks that existed at that point.)
    if (priestWards?.[visitorPlayerId]) {
      protections.set(visitorPlayerId, [
        ...(protections.get(visitorPlayerId) ?? []),
        WerewolfRole.Priest,
      ]);
    }
    pendingVeteranKills.push({
      counterkilledPlayerId: visitorPlayerId,
      veteranPlayerId,
      source: VeteranCounterkillSource.Visitor,
    });
  }

  return pendingVeteranKills;
}
