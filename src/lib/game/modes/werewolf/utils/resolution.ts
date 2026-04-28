import type { PlayerRoleAssignment } from "@/lib/types";
import { TargetCategory } from "../types";
import type { AnyNightAction, NightResolutionEvent } from "../types";
import { isTeamNightAction } from "../types";
import type { TeamNightAction, NightAction } from "../types";
import { WerewolfRole, getWerewolfRole } from "../roles";
import { isGroupPhaseKey, isRoleActive, baseGroupPhaseKey } from "./phase-keys";

export const SMITE_PHASE_KEY = "__narrator_smite__";
export const OLD_MAN_TIMER_KEY = "__old_man_timer__";

function allWerewolvesAreDead(
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
): boolean {
  return roleAssignments
    .filter((a) => {
      const role = getWerewolfRole(a.roleDefinitionId);
      return role?.isWerewolf === true;
    })
    .every((a) => deadPlayerIds.includes(a.playerId));
}

function chupacabraAttackApplies(
  targetPlayerId: string,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
): boolean {
  const targetAssignment = roleAssignments.find(
    (a) => a.playerId === targetPlayerId,
  );
  const targetRole = targetAssignment
    ? getWerewolfRole(targetAssignment.roleDefinitionId)
    : undefined;
  return (
    targetRole?.isWerewolf === true ||
    allWerewolvesAreDead(roleAssignments, deadPlayerIds)
  );
}

/**
 * Collects attacks and protections from all non-Witch, non-Spellcaster actions.
 * Returns the base attack/protect maps used by both full resolution and the
 * interim attacked-player query for the Witch.
 */
function collectBaseAttacksAndProtections(
  nightActions: Record<string, AnyNightAction>,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
  mirrorcasterCharged?: boolean,
): {
  attacks: Map<string, string[]>;
  protections: Map<string, string[]>;
} {
  const attacks = new Map<string, string[]>();
  const protections = new Map<string, string[]>();

  for (const [phaseKey, action] of Object.entries(nightActions)) {
    // Witch and Spellcaster are handled separately below.
    // Priest protection is handled via priestWards, not the generic Protect pipeline.
    if (
      isRoleActive(phaseKey, [
        WerewolfRole.Witch,
        WerewolfRole.Spellcaster,
        WerewolfRole.Priest,
        WerewolfRole.Altruist,
      ])
    )
      continue;

    if (isGroupPhaseKey(phaseKey)) {
      const groupAction = action as { suggestedTargetId?: string };
      if (!groupAction.suggestedTargetId) continue;
      const tid = groupAction.suggestedTargetId;
      attacks.set(tid, [...(attacks.get(tid) ?? []), phaseKey]);
      continue;
    }

    const soloAction = action as { targetPlayerId?: string };
    if (!soloAction.targetPlayerId) continue;
    const tid = soloAction.targetPlayerId;

    const role = getWerewolfRole(phaseKey);
    if (!role) continue;

    if (role.targetCategory === TargetCategory.Protect) {
      protections.set(tid, [...(protections.get(tid) ?? []), phaseKey]);
      continue;
    }

    if (role.targetCategory === TargetCategory.Attack) {
      if (
        isRoleActive(phaseKey, WerewolfRole.Chupacabra) &&
        !chupacabraAttackApplies(tid, roleAssignments, deadPlayerIds)
      ) {
        continue;
      }
      attacks.set(tid, [...(attacks.get(tid) ?? []), phaseKey]);
      continue;
    }

    // Mirrorcaster: acts as Protect when uncharged, Attack when charged.
    if (isRoleActive(phaseKey, WerewolfRole.Mirrorcaster)) {
      if (mirrorcasterCharged) {
        attacks.set(tid, [...(attacks.get(tid) ?? []), phaseKey]);
      } else {
        protections.set(tid, [...(protections.get(tid) ?? []), phaseKey]);
      }
    }
  }

  return { attacks, protections };
}

function buildKilledEvents(
  attacks: Map<string, string[]>,
  protections: Map<string, string[]>,
): NightResolutionEvent[] {
  return Array.from(attacks.entries()).map(([targetPlayerId, attackedBy]) => {
    const protectedBy = protections.get(targetPlayerId) ?? [];
    return {
      type: "killed" as const,
      targetPlayerId,
      attackedBy,
      protectedBy,
      died: protectedBy.length === 0,
    };
  });
}

/** Adds priest ward protections to the protections map for any warded player under attack. */
function applyPriestWards(
  attacks: Map<string, string[]>,
  protections: Map<string, string[]>,
  priestWards: Record<string, string>,
): void {
  for (const wardedPlayerId of Object.keys(priestWards)) {
    if (attacks.has(wardedPlayerId)) {
      protections.set(wardedPlayerId, [
        ...(protections.get(wardedPlayerId) ?? []),
        WerewolfRole.Priest,
      ]);
    }
  }
}

/**
 * Returns player IDs who are currently attacked but not yet protected,
 * excluding the Witch's own action. Used to show the Witch their available
 * targets before they act. Also considers priest wards.
 */
export function getInterimAttackedPlayerIds(
  nightActions: Record<string, AnyNightAction>,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
  priestWards?: Record<string, string>,
  mirrorcasterCharged?: boolean,
): string[] {
  const { attacks, protections } = collectBaseAttacksAndProtections(
    nightActions,
    roleAssignments,
    deadPlayerIds,
    mirrorcasterCharged,
  );
  if (priestWards) applyPriestWards(attacks, protections, priestWards);
  return Array.from(attacks.keys()).filter((id) => !protections.has(id));
}

/**
 * Resolves all night actions into a flat list of outcome events.
 * Only players who were targeted for attack appear as "killed" events.
 * Chupacabra attack only applies if the target is on Team.Bad,
 * or if all Team.Bad players are already dead.
 * Witch conditionally protects (if target is already attacked) or attacks.
 * Spellcaster emits a "silenced" event for their target.
 */
export interface NightResolutionOptions {
  /** Active priest wards: maps warded player ID → Priest player ID. */
  priestWards?: Record<string, string>;
  /** Player IDs of Tough Guys who have already survived one attack. */
  toughGuyHitIds?: string[];
  /**
   * If set, the Old Man's role timer has fired this night. If they were not
   * attacked by any player, they die peacefully (attackedBy: [OLD_MAN_TIMER_KEY]).
   * If they were attacked, the attack takes precedence and they die normally.
   */
  oldManTimerPlayerId?: string;
  /** When true, the Mirrorcaster is in Attack mode (charged from a prior protection). */
  mirrorcasterCharged?: boolean;
}

export function resolveNightActions(
  nightActions: Record<string, AnyNightAction>,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
  smitedPlayerIds?: string[],
  options?: NightResolutionOptions,
): NightResolutionEvent[] {
  const { attacks, protections } = collectBaseAttacksAndProtections(
    nightActions,
    roleAssignments,
    deadPlayerIds,
    options?.mirrorcasterCharged,
  );

  // Priest wards: warded players count as protected.
  if (options?.priestWards) {
    applyPriestWards(attacks, protections, options.priestWards);
  }

  // Witch: if target is already attacked → protect; otherwise → attack.
  const witchAction = nightActions[WerewolfRole.Witch] as
    | { targetPlayerId?: string }
    | undefined;
  if (witchAction?.targetPlayerId) {
    const tid = witchAction.targetPlayerId;
    if (attacks.has(tid)) {
      protections.set(tid, [
        ...(protections.get(tid) ?? []),
        WerewolfRole.Witch,
      ]);
    } else {
      attacks.set(tid, [...(attacks.get(tid) ?? []), WerewolfRole.Witch]);
    }
  }

  // Altruist intercept: if the Altruist chose a target that is under attack and
  // not already protected (including by the Witch), redirect the attack onto the
  // Altruist instead. Ignored if the Altruist is themselves already under attack
  // or if the target is the Altruist themselves.
  const altruistAction = nightActions[WerewolfRole.Altruist] as
    | { targetPlayerId?: string }
    | undefined;
  let altruistInterceptEvent: NightResolutionEvent | undefined;
  if (altruistAction?.targetPlayerId) {
    const savedId = altruistAction.targetPlayerId;
    const altruistPlayerId = roleAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.Altruist as string),
    )?.playerId;
    if (
      altruistPlayerId &&
      savedId !== altruistPlayerId &&
      attacks.has(savedId) &&
      !protections.has(savedId) &&
      !attacks.has(altruistPlayerId)
    ) {
      const attackers = attacks.get(savedId) ?? [];
      attacks.delete(savedId);
      attacks.set(altruistPlayerId, attackers);
      altruistInterceptEvent = {
        type: "altruist-intercepted",
        altruistPlayerId,
        savedPlayerId: savedId,
      };
    }
  }

  // Veteran alert: if the Veteran alerted this night, resolve counter-kills.
  // Counter-kills happen after the Altruist so the Altruist cannot intercept them.
  const veteranAction = nightActions[WerewolfRole.Veteran];
  const veteranAlerted =
    veteranAction !== undefined &&
    !isTeamNightAction(veteranAction) &&
    veteranAction.alerted === true;
  // Pending counter-kill entries; events are emitted after Tough Guy so the
  // `died` field reflects the actual outcome rather than the initial attack.
  const pendingVeteranKills: {
    counterkilledPlayerId: string;
    veteranPlayerId: string;
    source: "wolf-repel" | "protector-visit";
  }[] = [];

  if (veteranAlerted) {
    const veteranPlayerId = roleAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.Veteran as string),
    )?.playerId;

    if (veteranPlayerId) {
      // Werewolf attack repel: if a wolf group targeted the Veteran, remove
      // that attack and counterkill one alive wolf participant instead.
      // Track already-selected victims so multiple wolf-group phases don't
      // select the same wolf when there are bonus attack keys (e.g. Wolf Cub).
      const selectedWolfVictimIds = new Set<string>();
      for (const [phaseKey, action] of Object.entries(nightActions)) {
        if (!isGroupPhaseKey(phaseKey)) continue;
        const groupAction = action as TeamNightAction;
        if (groupAction.suggestedTargetId !== veteranPlayerId) continue;

        // Remove this wolf-group's attack entry from the Veteran.
        const attackers = attacks.get(veteranPlayerId) ?? [];
        const filteredAttackers = attackers.filter((a) => a !== phaseKey);
        if (filteredAttackers.length === 0) {
          attacks.delete(veteranPlayerId);
        } else {
          attacks.set(veteranPlayerId, filteredAttackers);
        }

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
          pendingVeteranKills.push({
            counterkilledPlayerId: wolfVictimId,
            veteranPlayerId,
            source: "wolf-repel",
          });
        }
      }

      // Protection visit kill: any Protect-category role (except Priest, which
      // uses a ward rather than a direct visit) whose targetPlayerId is the
      // Veteran is killed, and their protection is discarded.
      for (const [phaseKey, action] of Object.entries(nightActions)) {
        if (isGroupPhaseKey(phaseKey)) continue;
        if (isRoleActive(phaseKey, WerewolfRole.Priest)) continue;
        const soloAction = action as NightAction;
        if (soloAction.targetPlayerId !== veteranPlayerId) continue;
        const role = getWerewolfRole(phaseKey);
        if (role?.targetCategory !== TargetCategory.Protect) continue;

        const protectorPlayerId = roleAssignments.find(
          (a) => a.roleDefinitionId === phaseKey,
        )?.playerId;
        if (!protectorPlayerId || deadPlayerIds.includes(protectorPlayerId))
          continue;

        // Discard the protection of the Veteran.
        const veteranProtectors = protections.get(veteranPlayerId) ?? [];
        const filteredProtectors = veteranProtectors.filter(
          (p) => p !== phaseKey,
        );
        if (filteredProtectors.length === 0) {
          protections.delete(veteranPlayerId);
        } else {
          protections.set(veteranPlayerId, filteredProtectors);
        }

        // Queue the counter-kill attack.
        attacks.set(protectorPlayerId, [
          ...(attacks.get(protectorPlayerId) ?? []),
          WerewolfRole.Veteran,
        ]);
        pendingVeteranKills.push({
          counterkilledPlayerId: protectorPlayerId,
          veteranPlayerId,
          source: "protector-visit",
        });
      }
    }
  }

  let combatEvents = buildKilledEvents(attacks, protections);
  for (const smitedId of smitedPlayerIds ?? []) {
    const existing = combatEvents.find(
      (e) => e.type === "killed" && e.targetPlayerId === smitedId,
    );
    if (existing?.type === "killed") {
      existing.attackedBy = [...existing.attackedBy, SMITE_PHASE_KEY];
      existing.died = true;
    } else {
      combatEvents = [
        ...combatEvents,
        {
          type: "killed" as const,
          targetPlayerId: smitedId,
          attackedBy: [SMITE_PHASE_KEY],
          protectedBy: [],
          died: true,
        },
      ];
    }
  }

  // Old Man timer: if the timer fires and the Old Man was not attacked by any
  // player this night, they die peacefully (unblockable, like smite).
  // If they were attacked, the attack takes precedence (no timer event added).
  if (options?.oldManTimerPlayerId) {
    const existing = combatEvents.find(
      (e) =>
        e.type === "killed" && e.targetPlayerId === options.oldManTimerPlayerId,
    );
    if (!existing) {
      combatEvents = [
        ...combatEvents,
        {
          type: "killed" as const,
          targetPlayerId: options.oldManTimerPlayerId,
          attackedBy: [OLD_MAN_TIMER_KEY],
          protectedBy: [],
          died: true,
        },
      ];
    }
  }

  // Tough Guy: if unprotected and not already hit, absorb the attack.
  const toughGuyHitIds = new Set(options?.toughGuyHitIds ?? []);
  const toughGuyEvents: NightResolutionEvent[] = [];
  for (const event of combatEvents) {
    if (event.type !== "killed" || !event.died) continue;
    const assignment = roleAssignments.find(
      (a) => a.playerId === event.targetPlayerId,
    );
    if (
      assignment?.roleDefinitionId === WerewolfRole.ToughGuy &&
      !toughGuyHitIds.has(event.targetPlayerId)
    ) {
      event.died = false;
      toughGuyEvents.push({
        type: "tough-guy-absorbed",
        targetPlayerId: event.targetPlayerId,
      });
    }
  }

  // Veteran counter-kill events: emitted here so `died` reflects the actual
  // outcome after Tough Guy absorption.
  const veteranCounterkilledEvents: NightResolutionEvent[] =
    pendingVeteranKills.map((kill) => {
      const combatEvent = combatEvents.find(
        (e) =>
          e.type === "killed" &&
          e.targetPlayerId === kill.counterkilledPlayerId,
      );
      return {
        type: "veteran-counterkilled" as const,
        counterkilledPlayerId: kill.counterkilledPlayerId,
        veteranPlayerId: kill.veteranPlayerId,
        source: kill.source,
        died: combatEvent?.type === "killed" ? combatEvent.died : true,
      };
    });

  // Spellcaster: emit a silenced event for their target.
  const spellcasterAction = nightActions[WerewolfRole.Spellcaster] as
    | { targetPlayerId?: string }
    | undefined;
  const silencedEvents: NightResolutionEvent[] =
    spellcasterAction?.targetPlayerId
      ? [{ type: "silenced", targetPlayerId: spellcasterAction.targetPlayerId }]
      : [];

  // Mummy: emit a hypnotized event for their target.
  const mummyAction = nightActions[WerewolfRole.Mummy] as
    | { targetPlayerId?: string }
    | undefined;
  const mummyPlayerId = roleAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.Mummy as string),
  )?.playerId;
  const hypnotizedEvents: NightResolutionEvent[] =
    mummyAction?.targetPlayerId && mummyPlayerId
      ? [
          {
            type: "hypnotized",
            targetPlayerId: mummyAction.targetPlayerId,
            mummyPlayerId,
          },
        ]
      : [];

  return [
    ...combatEvents,
    ...toughGuyEvents,
    ...(altruistInterceptEvent ? [altruistInterceptEvent] : []),
    ...veteranCounterkilledEvents,
    ...silencedEvents,
    ...hypnotizedEvents,
  ];
}
