import type { PlayerRoleAssignment } from "@/lib/types";
import { TargetCategory } from "../types";
import type { AnyNightAction, NightResolutionEvent } from "../types";
import { WEREWOLF_ROLES, WerewolfRole } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";
import { isGroupPhaseKey, isRoleActive } from "./phase-keys";

export const SMITE_PHASE_KEY = "__narrator_smite__";
export const OLD_MAN_TIMER_KEY = "__old_man_timer__";

function allWerewolvesAreDead(
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
): boolean {
  return roleAssignments
    .filter((a) => {
      const role = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
        a.roleDefinitionId
      ];
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
    ? (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
        targetAssignment.roleDefinitionId
      ]
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

    const role = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
      phaseKey
    ];
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

  let combatEvents = buildKilledEvents(attacks, protections);

  // Narrator smites: force death regardless of protections.
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
    ...silencedEvents,
    ...hypnotizedEvents,
  ];
}
