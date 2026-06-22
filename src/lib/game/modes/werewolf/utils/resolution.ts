import type { PlayerRoleAssignment } from "@/lib/types";

import { WerewolfRole } from "../roles";
import type { AnyNightAction, NightResolutionEvent } from "../types";
import {
  applyArsonistIgnite,
  applyPriestWards,
  buildKilledEvents,
  collectBaseAttacksAndProtections,
} from "./attack-map";
import { applyMonarchProtection } from "./monarch-resolution";
import { collectVeteranCounterkills } from "./veteran-resolution";

export const SMITE_PHASE_KEY = "__narrator_smite__";
export const OLD_MAN_TIMER_KEY = "__old_man_timer__";

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

  // Veteran alert: resolve counter-kills against the final attack/protection
  // maps. Runs after the Altruist and Swapper so neither can intercept them.
  // Events are emitted after Tough Guy (below) so `died` reflects the outcome.
  const pendingVeteranKills = collectVeteranCounterkills(
    nightActions,
    roleAssignments,
    deadPlayerIds,
    attacks,
    protections,
    options?.priestWards,
    options?.mercenaryCharged,
  );

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
  // Smite and Old Man timer deaths are forced deaths that cannot be absorbed.
  const toughGuyHitIds = new Set(options?.toughGuyHitIds ?? []);
  const toughGuyEvents: NightResolutionEvent[] = [];
  for (const event of combatEvents) {
    if (event.type !== "killed" || !event.died) continue;
    // Smite and Old Man timer deaths are unblockable — skip Tough Guy absorption.
    if (
      event.attackedBy.includes(SMITE_PHASE_KEY) ||
      event.attackedBy.includes(OLD_MAN_TIMER_KEY)
    )
      continue;
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
      if (e.type === "silenced" && e.targetPlayerId === aId)
        return { ...e, targetPlayerId: bId };
      if (e.type === "silenced" && e.targetPlayerId === bId)
        return { ...e, targetPlayerId: aId };
      return e;
    });
    finalHypnotizedEvents = hypnotizedEvents.map((e) => {
      if (e.type === "hypnotized" && e.targetPlayerId === aId)
        return { ...e, targetPlayerId: bId };
      if (e.type === "hypnotized" && e.targetPlayerId === bId)
        return { ...e, targetPlayerId: aId };
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
    ...veteranCounterkilledEvents,
    ...finalSilencedEvents,
    ...finalHypnotizedEvents,
    ...swapperEvents,
  ];
}
