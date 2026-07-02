import type { Game, GameAction } from "@/lib/types";

import { getWerewolfModeConfig } from "../lobby-config";
import { WerewolfRole } from "../roles";
import { getOrderedAffectedPlayerIds } from "../services";
import type {
  AttackNightResolutionEvent,
  WerewolfNighttimePhase,
  WerewolfRoleTurnState,
} from "../types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import {
  computeArsonistDousedPlayerIds,
  computeDraculaWives,
  computeMercenaryState,
  computeMirrorcasterCharged,
  computeZombieInfected,
} from "./start-day-carry-forward";
import {
  applyVigilanteSelfDeath,
  buildLastTargets,
  buildNewRoleState,
  computeMorticianAbilityEnded,
} from "./start-day-helpers";
import {
  computeExposerReveal,
  computeMonarchKnightingState,
  computeOesLockedTargetId,
  computeOldManTimerPlayerId,
  computePriestWards,
} from "./start-day-night-resolution";
import {
  buildEffectiveAssignments,
  buildPriestWardsForResolution,
  findMonarchPlayerId,
  runNightResolution,
} from "./start-day-resolution-setup";
import {
  computeEvilEmpathRevealedResult,
  computeIllusionTargetId,
  computeOnceTargetAbilityUsed,
  computeThingTapped,
  computeToughGuyHitIds,
  computeVeteranAlertsUsed,
  computeWolfCubDied,
  ensureEvilEmpathResultComputed,
} from "./start-day-role-tracking";
import {
  applyStartDayEndConditions,
  buildDaytimeStatus,
} from "./start-day-turn-state";

export const startDayAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    return currentTurnState(game)?.phase.type === WerewolfPhase.Nighttime;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const nightPhase = ts.phase as WerewolfNighttimePhase;

    const rs = ts.roleState ?? {};

    // Apply any mid-game roleOverrides so all resolution logic uses the current
    // effective role, not the original assignment.
    const effectiveAssignments = buildEffectiveAssignments(
      game.roleAssignments,
      ts.roleOverrides,
    );

    // Priest wards used during resolution protect the target on the same night
    // the ward is placed.
    const priestWardsForResolution = buildPriestWardsForResolution(
      nightPhase.nightActions,
      effectiveAssignments,
      rs,
    );

    // Old Man timer: fires after (#werewolves + 2) nights.
    const oldManTimerPlayerId = computeOldManTimerPlayerId(
      effectiveAssignments,
      ts.deadPlayerIds,
      ts.turn,
    );

    const {
      monarchKnightedPlayerIds,
      monarchKnightingsUsed,
      knightedPlayerId,
    } = computeMonarchKnightingState(nightPhase.nightActions, rs);
    const monarchPlayerId = findMonarchPlayerId(game.roleAssignments);

    const nightResolution = runNightResolution({
      nightPhase,
      effectiveAssignments,
      deadPlayerIds: ts.deadPlayerIds,
      rs,
      priestWardsForResolution,
      oldManTimerPlayerId,
      monarchPlayerId,
      monarchKnightedPlayerIds,
    });

    const newDeadIds: string[] = nightResolution
      .filter(
        (e): e is AttackNightResolutionEvent => e.type === "killed" && e.died,
      )
      .map((e) => e.targetPlayerId);

    // Tough Guy hits: players who absorbed an attack this night.
    const toughGuyHitIds = computeToughGuyHitIds(nightResolution, rs);

    // Consume priest wards for any warded player who was attacked this night.
    const priestWards = computePriestWards(
      nightResolution,
      priestWardsForResolution,
    );

    // One-Eyed Seer lock: locks onto an investigated werewolf; cleared if the
    // locked target died this night.
    const oneEyedSeerLockedTargetId = computeOesLockedTargetId(
      nightPhase.nightActions,
      effectiveAssignments,
      newDeadIds,
      rs.oneEyedSeer?.lockedTargetId,
    );

    // Exposer reveal: capture any new reveal for this day's summary.
    const { newExposerReveal, exposerReveal } = computeExposerReveal(
      nightPhase.nightActions,
      effectiveAssignments,
      rs.exposer?.reveal,
    );

    const illusionTargetId = computeIllusionTargetId(nightPhase.nightActions);

    // Auto-compute the Evil Empath result if it was the final active phase but
    // was never resolved (same guard used in setNightPhaseAction).
    ensureEvilEmpathResultComputed(game, nightPhase);

    // Carry the last known adjacency result forward so it can be revealed to
    // Werewolves when the Evil Empath dies.
    const evilEmpathLastResult = ts.roleState?.evilEmpath?.lastResult;
    const evilEmpathRevealedResult = computeEvilEmpathRevealedResult(
      ts,
      effectiveAssignments,
      newDeadIds,
    );

    // Build lastTargets for roles that prevent consecutive same-player targeting.
    const lastTargets = buildLastTargets(nightPhase.nightActions);

    // Vigilante self-death: if the Vigilante killed a Good-team player, they die
    // too. Skip if already killed this night. Mutates newDeadIds in place.
    applyVigilanteSelfDeath(
      nightPhase.nightActions,
      effectiveAssignments,
      ts.deadPlayerIds,
      newDeadIds,
    );

    // Mortician ability: ends if the Mortician killed a Werewolf this night.
    const morticianAbilityEnded = computeMorticianAbilityEnded(
      nightPhase.nightActions,
      effectiveAssignments,
      newDeadIds,
      rs.mortician?.abilityEnded === true,
    );

    // Hunter revenge: if the Hunter died this night, defer win-condition check
    // until the narrator resolves the Hunter's revenge target.
    const hunterAssignment = effectiveAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.Hunter as string),
    );
    const hunterDiedThisNight =
      hunterAssignment !== undefined &&
      newDeadIds.includes(hunterAssignment.playerId);

    // Once-per-game ability tracking for target-based roles.
    const witchAbilityUsed = computeOnceTargetAbilityUsed(
      nightPhase.nightActions,
      WerewolfRole.Witch,
      rs.witch?.abilityUsed === true,
    );
    const exposerAbilityUsed = computeOnceTargetAbilityUsed(
      nightPhase.nightActions,
      WerewolfRole.Exposer,
      rs.exposer?.abilityUsed === true,
    );

    const mirrorcasterCharged = computeMirrorcasterCharged(
      nightPhase.nightActions,
      nightResolution,
      rs,
    );

    const { mercenaryCharged, mercenaryBribedPlayerIds } =
      computeMercenaryState(nightPhase.nightActions, nightResolution, rs);

    const updatedDeadIds = [...ts.deadPlayerIds, ...newDeadIds];

    const draculaWives = computeDraculaWives(
      nightPhase.nightActions,
      rs,
      updatedDeadIds,
    );

    const zombieInfected = computeZombieInfected(
      nightPhase.nightActions,
      rs,
      updatedDeadIds,
    );

    const veteranAlertsUsed = computeVeteranAlertsUsed(
      nightPhase.nightActions,
      rs,
    );

    const thingTapped = computeThingTapped(nightPhase.nightActions);

    const arsonistDousedPlayerIds = computeArsonistDousedPlayerIds(
      nightPhase.nightActions,
      game.roleAssignments,
      rs,
      updatedDeadIds,
    );

    const wolfCubDied = computeWolfCubDied(newDeadIds, game, rs);
    const revealedPlayerIds = getWerewolfModeConfig(game).autoRevealNightOutcome
      ? getOrderedAffectedPlayerIds(nightResolution)
      : [];

    const newRoleState: WerewolfRoleTurnState = buildNewRoleState({
      rs,
      witchAbilityUsed,
      wolfCubDied,
      priestWards,
      toughGuyHitIds,
      oneEyedSeerLockedTargetId,
      exposerAbilityUsed,
      exposerReveal,
      hunterDiedThisNight,
      hunterPlayerId: hunterAssignment?.playerId,
      morticianAbilityEnded,
      monarchKnightedPlayerIds,
      monarchKnightingsUsed,
      mirrorcasterCharged,
      mercenaryCharged,
      mercenaryBribedPlayerIds,
      thingTapped,
      draculaWives,
      zombieInfected,
      arsonistDousedPlayerIds,
      illusionTargetId,
      evilEmpathLastResult,
      evilEmpathRevealedResult,
      veteranAlertsUsed,
    });

    game.status = buildDaytimeStatus({
      turn: ts.turn,
      nightActions: nightPhase.nightActions,
      revealedPlayerIds,
      nightResolution,
      newExposerReveal,
      knightedPlayerId,
      smitedPlayerIds: nightPhase.smitedPlayerIds,
      updatedDeadIds,
      lastTargets,
      roleOverrides: ts.roleOverrides,
      newRoleState,
    });

    // Terminal win conditions checked after the turn state is built so all
    // deaths and night resolution are recorded.
    applyStartDayEndConditions(
      game,
      effectiveAssignments,
      newDeadIds,
      updatedDeadIds,
      hunterDiedThisNight,
    );
  },
};
