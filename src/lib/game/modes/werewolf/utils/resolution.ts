import type { PlayerRoleAssignment } from "@/lib/types";
import { Team } from "@/lib/types";

import { getWerewolfRole, WerewolfRole } from "../roles";
import type {
  AnyNightAction,
  HypnotizedNightResolutionEvent,
  NightResolutionEvent,
  SilencedNightResolutionEvent,
} from "../types";
import { TargetCategory } from "../types";
import { isGroupPhaseKey, isRoleActive } from "./phase-keys";
import { getGroupPhasePlayerIds } from "./targeting";

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
  mercenaryCharged?: boolean,
): {
  attacks: Map<string, string[]>;
  protections: Map<string, string[]>;
} {
  const attacks = new Map<string, string[]>();
  const protections = new Map<string, string[]>();

  for (const [phaseKey, action] of Object.entries(nightActions)) {
    // Witch and Spellcaster are handled separately below.
    // Priest protection is handled via priestWards, not the generic Protect pipeline.
    // Altruist intercept is applied after this loop.
    // Swapper swap is applied after Altruist intercept.
    if (
      isRoleActive(phaseKey, [
        WerewolfRole.Witch,
        WerewolfRole.Spellcaster,
        WerewolfRole.Priest,
        WerewolfRole.Altruist,
        WerewolfRole.Swapper,
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

    // Mercenary: acts as Protect when uncharged (no combat effect when charged — bribe only).
    if (isRoleActive(phaseKey, WerewolfRole.Mercenary)) {
      if (!mercenaryCharged) {
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

/** Adds Arsonist ignite attacks to the attacks map when the Arsonist self-targeted. */
function applyArsonistIgnite(
  attacks: Map<string, string[]>,
  nightActions: Record<string, AnyNightAction>,
  roleAssignments: PlayerRoleAssignment[],
  arsonistDousedPlayerIds: string[] | undefined,
): void {
  if (!arsonistDousedPlayerIds?.length) return;
  const arsonistAction = nightActions[WerewolfRole.Arsonist] as
    | { targetPlayerId?: string }
    | undefined;
  const arsonistPlayerId = roleAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.Arsonist as string),
  )?.playerId;
  if (
    arsonistAction?.targetPlayerId &&
    arsonistAction.targetPlayerId === arsonistPlayerId
  ) {
    for (const dousedId of arsonistDousedPlayerIds) {
      attacks.set(dousedId, [
        ...(attacks.get(dousedId) ?? []),
        WerewolfRole.Arsonist,
      ]);
    }
  }
}

/**
 * Returns player IDs who are currently attacked but not yet protected,
 * excluding the Witch's own action. Used to show the Witch their available
 * targets before they act. Also considers priest wards and Arsonist ignite.
 */
export function getInterimAttackedPlayerIds(
  nightActions: Record<string, AnyNightAction>,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
  priestWards?: Record<string, string>,
  mirrorcasterCharged?: boolean,
  mercenaryCharged?: boolean,
  arsonistDousedPlayerIds?: string[],
): string[] {
  const { attacks, protections } = collectBaseAttacksAndProtections(
    nightActions,
    roleAssignments,
    deadPlayerIds,
    mirrorcasterCharged,
    mercenaryCharged,
  );
  applyArsonistIgnite(
    attacks,
    nightActions,
    roleAssignments,
    arsonistDousedPlayerIds,
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
  /** When true, the Mercenary is in Bribe mode (charged from a prior protection). */
  mercenaryCharged?: boolean;
  /**
   * Player IDs that the Arsonist has previously doused. When the Arsonist
   * self-targets (ignite), all of these players are simultaneously attacked.
   */
  arsonistDousedPlayerIds?: string[];
  /** Monarch protection metadata evaluated before Altruist interception. */
  monarchProtection?: {
    monarchPlayerId: string;
    monarchKnightedPlayerIds: string[];
  };
}

function getAttackerIds(
  attackedBy: string[],
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
): string[] {
  const attackerIds = new Set<string>();
  for (const phaseKey of attackedBy) {
    if (isGroupPhaseKey(phaseKey)) {
      for (const playerId of getGroupPhasePlayerIds(
        roleAssignments,
        phaseKey,
        deadPlayerIds,
      )) {
        attackerIds.add(playerId);
      }
      continue;
    }
    const attacker = roleAssignments.find(
      (assignment) =>
        assignment.roleDefinitionId === phaseKey &&
        !deadPlayerIds.includes(assignment.playerId),
    );
    if (attacker) attackerIds.add(attacker.playerId);
  }
  return [...attackerIds];
}

function applyMonarchProtection(
  attacks: Map<string, string[]>,
  protections: Map<string, string[]>,
  roleAssignments: PlayerRoleAssignment[],
  deadPlayerIds: string[],
  monarchProtection: {
    monarchPlayerId: string;
    monarchKnightedPlayerIds: string[];
  },
): void {
  const { monarchPlayerId, monarchKnightedPlayerIds } = monarchProtection;
  if (!attacks.has(monarchPlayerId)) return;

  const livingKnightedPlayerIds = monarchKnightedPlayerIds.filter(
    (playerId) => !deadPlayerIds.includes(playerId),
  );
  if (livingKnightedPlayerIds.length === 0) return;

  const attackerIds = getAttackerIds(
    attacks.get(monarchPlayerId) ?? [],
    roleAssignments,
    deadPlayerIds,
  );
  const getRoleForPlayer = (playerId: string) => {
    const roleDefinitionId = roleAssignments.find(
      (assignment) => assignment.playerId === playerId,
    )?.roleDefinitionId;
    return roleDefinitionId ? getWerewolfRole(roleDefinitionId) : undefined;
  };
  const livingKnightedRoleDefs = livingKnightedPlayerIds
    .map((playerId) => getRoleForPlayer(playerId))
    .filter((roleDef) => roleDef !== undefined);
  const allLivingKnightedPlayersAreBad = livingKnightedRoleDefs.every(
    (roleDef) => roleDef.team === Team.Bad,
  );
  const badAttackerExists = attackerIds.some((playerId) => {
    const attackerRole = getRoleForPlayer(playerId);
    return attackerRole?.team === Team.Bad;
  });
  const onlyLivingKnightedPlayerId =
    livingKnightedPlayerIds.length === 1
      ? livingKnightedPlayerIds[0]
      : undefined;
  const attackerIsOnlyLivingKnightedPlayer =
    onlyLivingKnightedPlayerId !== undefined &&
    attackerIds.includes(onlyLivingKnightedPlayerId);

  if (
    (badAttackerExists && allLivingKnightedPlayersAreBad) ||
    attackerIsOnlyLivingKnightedPlayer
  ) {
    return;
  }

  protections.set(monarchPlayerId, [
    ...(protections.get(monarchPlayerId) ?? []),
    WerewolfRole.Monarch,
  ]);
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
    options?.mercenaryCharged,
  );

  // Arsonist ignite: if the Arsonist self-targeted, attack every doused player simultaneously.
  // Applied before Priest wards and the Witch so that wards/protections can apply to ignite targets.
  applyArsonistIgnite(
    attacks,
    nightActions,
    roleAssignments,
    options?.arsonistDousedPlayerIds,
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

  if (options?.monarchProtection) {
    applyMonarchProtection(
      attacks,
      protections,
      roleAssignments,
      deadPlayerIds,
      options.monarchProtection,
    );
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

  // Swapper: swap the attacks and protections between the two selected players.
  // Runs after all other attack/protect modifiers so it operates on the final
  // attack and protection state. Silenced and hypnotized events are swapped later.
  const swapperAction = nightActions[WerewolfRole.Swapper] as
    | {
        targetPlayerId?: string;
        secondTargetPlayerId?: string;
        skipped?: boolean;
      }
    | undefined;
  const swapperAId = swapperAction?.targetPlayerId;
  const swapperBId = swapperAction?.secondTargetPlayerId;
  if (
    typeof swapperAId === "string" &&
    typeof swapperBId === "string" &&
    swapperAId !== swapperBId &&
    !swapperAction?.skipped
  ) {
    const aId = swapperAId;
    const bId = swapperBId;
    const aAttacks = attacks.get(aId);
    const bAttacks = attacks.get(bId);
    const aProtections = protections.get(aId);
    const bProtections = protections.get(bId);
    if (bAttacks !== undefined) {
      attacks.set(aId, bAttacks);
    } else {
      attacks.delete(aId);
    }
    if (aAttacks !== undefined) {
      attacks.set(bId, aAttacks);
    } else {
      attacks.delete(bId);
    }
    if (bProtections !== undefined) {
      protections.set(aId, bProtections);
    } else {
      protections.delete(aId);
    }
    if (aProtections !== undefined) {
      protections.set(bId, aProtections);
    } else {
      protections.delete(bId);
    }

    // If the Altruist intercept redirected an attack onto the Altruist, but the
    // Swapper subsequently moved that attack away, the intercept event is stale.
    if (
      altruistInterceptEvent?.type === "altruist-intercepted" &&
      !attacks.has(altruistInterceptEvent.altruistPlayerId)
    ) {
      altruistInterceptEvent = undefined;
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
  const silencedEvents: SilencedNightResolutionEvent[] =
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
  const hypnotizedEvents: HypnotizedNightResolutionEvent[] =
    mummyAction?.targetPlayerId && mummyPlayerId
      ? [
          {
            type: "hypnotized",
            targetPlayerId: mummyAction.targetPlayerId,
            mummyPlayerId,
          },
        ]
      : [];

  // Swapper: swap silenced and hypnotized events between the two selected players.
  // (Attacks and protections were already swapped above, before buildKilledEvents.)
  const swapperEvents: NightResolutionEvent[] = [];
  let finalSilencedEvents = silencedEvents;
  let finalHypnotizedEvents = hypnotizedEvents;
  if (
    typeof swapperAId === "string" &&
    typeof swapperBId === "string" &&
    swapperAId !== swapperBId &&
    !swapperAction?.skipped
  ) {
    const aId = swapperAId;
    const bId = swapperBId;
    finalSilencedEvents = silencedEvents.map((e) => {
      if (e.targetPlayerId === aId) return { ...e, targetPlayerId: bId };
      if (e.targetPlayerId === bId) return { ...e, targetPlayerId: aId };
      return e;
    });
    finalHypnotizedEvents = hypnotizedEvents.map((e) => {
      if (e.targetPlayerId === aId) return { ...e, targetPlayerId: bId };
      if (e.targetPlayerId === bId) return { ...e, targetPlayerId: aId };
      return e;
    });
    swapperEvents.push({
      type: "swapper-swapped",
      firstPlayerId: aId,
      secondPlayerId: bId,
    });
  }

  return [
    ...combatEvents,
    ...toughGuyEvents,
    ...(altruistInterceptEvent ? [altruistInterceptEvent] : []),
    ...finalSilencedEvents,
    ...finalHypnotizedEvents,
    ...swapperEvents,
  ];
}
