import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";

import { getWerewolfModeConfig } from "../lobby-config";
import { WerewolfRole } from "../roles";
import { getOrderedAffectedPlayerIds } from "../services";
import type {
  AttackNightResolutionEvent,
  ToughGuyAbsorbedNightResolutionEvent,
  WerewolfNighttimePhase,
  WerewolfRoleTurnState,
} from "../types";
import { isTeamNightAction, WerewolfPhase } from "../types";
import {
  checkWinCondition,
  currentTurnState,
  isOwnerPlaying,
  resolveNightActions,
  WerewolfWinner,
} from "../utils";
import { confirmEvilEmpathResultAction } from "./confirm-evil-empath-result";
import { didWolfCubDie } from "./helpers";
import {
  applyVigilanteSelfDeath,
  buildLastTargets,
  buildNewRoleState,
  computeArsonistDousedPlayerIds,
  computeDraculaWives,
  computeExposerReveal,
  computeMercenaryState,
  computeMirrorcasterCharged,
  computeMonarchKnightingState,
  computeMorticianAbilityEnded,
  computeOesLockedTargetId,
  computeOldManTimerPlayerId,
  computePriestWards,
  computeZombieInfected,
} from "./start-day-helpers";

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

    // Build effective role assignments — apply any mid-game roleOverrides
    // (Alpha Wolf bite, Village Drunk sober) so all resolution logic uses
    // the current effective role, not the original assignment.
    const roleOverrides = ts.roleOverrides;
    const effectiveAssignments = roleOverrides
      ? game.roleAssignments.map((a) => {
          const override = roleOverrides[a.playerId];
          return override ? { ...a, roleDefinitionId: override } : a;
        })
      : game.roleAssignments;

    // Build priest wards: carry forward existing wards and add any new ward
    // from this night's Priest action BEFORE resolution so the ward protects
    // the target on the same night it is placed.
    const priestWardsForResolution: Record<string, string> = {
      ...(rs.priest?.wards ?? {}),
    };
    const priestAction = nightPhase.nightActions[WerewolfRole.Priest];
    if (
      priestAction &&
      !isTeamNightAction(priestAction) &&
      priestAction.targetPlayerId
    ) {
      const priestPlayerId = effectiveAssignments.find(
        (a) => a.roleDefinitionId === (WerewolfRole.Priest as string),
      )?.playerId;
      if (priestPlayerId) {
        priestWardsForResolution[priestAction.targetPlayerId] = priestPlayerId;
      }
    }

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
    const monarchPlayerId = game.roleAssignments.find(
      (assignment) =>
        assignment.roleDefinitionId === (WerewolfRole.Monarch as string),
    )?.playerId;

    const nightResolution = resolveNightActions(
      nightPhase.nightActions,
      effectiveAssignments,
      ts.deadPlayerIds,
      nightPhase.smitedPlayerIds,
      {
        priestWards: priestWardsForResolution,
        toughGuyHitIds: rs.toughGuy?.hitIds,
        ...(oldManTimerPlayerId ? { oldManTimerPlayerId } : {}),
        ...(rs.mirrorcaster?.charged ? { mirrorcasterCharged: true } : {}),
        ...(rs.mercenary?.charged ? { mercenaryCharged: true } : {}),
        ...(monarchPlayerId
          ? {
              monarchProtection: {
                monarchPlayerId,
                monarchKnightedPlayerIds,
              },
            }
          : {}),
        ...(rs.arsonist?.dousedPlayerIds.length
          ? { arsonistDousedPlayerIds: rs.arsonist.dousedPlayerIds }
          : {}),
      },
    );

    const newDeadIds: string[] = nightResolution
      .filter(
        (e): e is AttackNightResolutionEvent => e.type === "killed" && e.died,
      )
      .map((e) => e.targetPlayerId);

    // Track Tough Guy hits: players who absorbed an attack this night.
    const newToughGuyHitIds = nightResolution
      .filter(
        (e): e is ToughGuyAbsorbedNightResolutionEvent =>
          e.type === "tough-guy-absorbed",
      )
      .map((e) => e.targetPlayerId);
    const toughGuyHitIds = [
      ...(rs.toughGuy?.hitIds ?? []),
      ...newToughGuyHitIds,
    ];

    // Consume priest wards for any warded player who was attacked this night,
    // regardless of whether other protections also saved them.
    const priestWards = computePriestWards(nightResolution, priestWardsForResolution);

    // One-Eyed Seer lock: if the OES investigated a werewolf this night, lock them on.
    // If the OES's locked target died this night, the lock is cleared.
    const oneEyedSeerLockedTargetId = computeOesLockedTargetId(
      nightPhase.nightActions,
      effectiveAssignments,
      newDeadIds,
      rs.oneEyedSeer?.lockedTargetId,
    );

    // Exposer reveal: if the Exposer confirmed a target this night, capture the
    // new reveal for this day's summary on the daytime phase.
    const { newExposerReveal, exposerReveal } = computeExposerReveal(
      nightPhase.nightActions,
      effectiveAssignments,
      rs.exposer?.reveal,
    );

    // Illusion Artist: extract the target from this night's action to carry into
    // roleState.illusionArtist.illusionTargetId. Seer result resolution reads
    // this to invert the result when the Seer's target matches this player.
    const illusionRawAction =
      nightPhase.nightActions[WerewolfRole.IllusionArtist as string];
    const illusionAction =
      illusionRawAction && !isTeamNightAction(illusionRawAction)
        ? illusionRawAction
        : undefined;
    const illusionTargetId =
      illusionAction?.confirmed && illusionAction.targetPlayerId
        ? illusionAction.targetPlayerId
        : undefined;

    // Evil Empath: if the Evil Empath was the last (active) night phase and the
    // result was never computed (e.g. narrator advanced directly to start-day,
    // or the generic skip/confirm flow set confirmed without resultRevealed),
    // auto-compute it now — same guard used in setNightPhaseAction.
    const finalPhaseKey =
      nightPhase.nightPhaseOrder[nightPhase.currentPhaseIndex];
    const finalPhaseAction = nightPhase.nightActions[finalPhaseKey ?? ""];
    const evilEmpathAlreadyComputed =
      finalPhaseKey === (WerewolfRole.EvilEmpath as string) &&
      finalPhaseAction &&
      !("votes" in finalPhaseAction) &&
      finalPhaseAction.confirmed === true &&
      finalPhaseAction.resultRevealed === true;
    if (
      finalPhaseKey === (WerewolfRole.EvilEmpath as string) &&
      !evilEmpathAlreadyComputed
    ) {
      confirmEvilEmpathResultAction.apply(game, {}, "");
    }

    // Evil Empath: carry the last known adjacency result forward so it can be
    // revealed to Werewolves when the Evil Empath dies.
    const evilEmpathLastResult = ts.roleState?.evilEmpath?.lastResult;

    // Evil Empath death trigger: if the Evil Empath died this night and there is
    // a last result, set revealedResult so Werewolves see it. Use
    // effectiveAssignments so mid-game roleOverrides are respected.
    const evilEmpathAssignment = effectiveAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.EvilEmpath as string),
    );
    const evilEmpathRevealedResult =
      ts.roleState?.evilEmpath?.revealedResult ??
      (evilEmpathAssignment !== undefined &&
      newDeadIds.includes(evilEmpathAssignment.playerId) &&
      evilEmpathLastResult !== undefined
        ? evilEmpathLastResult
        : undefined);

    // Build lastTargets for roles that prevent consecutive same-player targeting.
    const lastTargets = buildLastTargets(nightPhase.nightActions);

    // Vigilante self-death: if the Vigilante killed a Good-team player, they die too.
    // Skip if the Vigilante was already killed this night (e.g. by wolves).
    applyVigilanteSelfDeath(
      nightPhase.nightActions,
      effectiveAssignments,
      ts.deadPlayerIds,
      newDeadIds,
    );

    // Mortician ability: check if the Mortician killed a Werewolf this night.
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

    // Once-per-game ability tracking: detect if a once-per-game role acted
    // this night (has a targetPlayerId, not skipped). This handles all paths
    // (player confirm, narrator override) in one place.
    const witchAction = nightPhase.nightActions[WerewolfRole.Witch as string];
    const witchAbilityUsed =
      rs.witch?.abilityUsed === true ||
      (witchAction !== undefined &&
        !isTeamNightAction(witchAction) &&
        witchAction.targetPlayerId !== undefined);

    const exposerNightAction =
      nightPhase.nightActions[WerewolfRole.Exposer as string];
    const exposerAbilityUsed =
      rs.exposer?.abilityUsed === true ||
      (exposerNightAction !== undefined &&
        !isTeamNightAction(exposerNightAction) &&
        exposerNightAction.targetPlayerId !== undefined);

    // Mirrorcaster charge tracking:
    // - If uncharged and the protected target was attacked → gain charge
    // - If charged → charge is consumed (attack was used this night)
    const mirrorcasterCharged = computeMirrorcasterCharged(
      nightPhase.nightActions,
      nightResolution,
      rs,
    );

    // Mercenary charge/bribe tracking:
    // - If uncharged (protect mode) and the protected target was attacked → gain charge (earn coin)
    // - If charged (bribe mode) and a bribe target was submitted → append to bribedPlayerIds, clear charge
    // - If charged (bribe mode) and no bribe target was submitted → carry charge forward
    const { mercenaryCharged, mercenaryBribedPlayerIds } =
      computeMercenaryState(nightPhase.nightActions, nightResolution, rs);

    const updatedDeadIds = [...ts.deadPlayerIds, ...newDeadIds];

    // Dracula: add the night's wife target to the accumulated list.
    // Exclude the target if they died the same night they were claimed.
    const draculaWives = computeDraculaWives(
      nightPhase.nightActions,
      rs,
      updatedDeadIds,
    );

    // Zombie: add the night's infection target to the accumulated list (if not already infected).
    // Exclude the target if they died the same night they were infected.
    const zombieInfected = computeZombieInfected(
      nightPhase.nightActions,
      rs,
      updatedDeadIds,
    );

    // Veteran alert usage tracking: increment once per night the Veteran alerts.
    const veteranNightAction = nightPhase.nightActions[WerewolfRole.Veteran];
    const veteranAlertedThisNight =
      veteranNightAction !== undefined &&
      !isTeamNightAction(veteranNightAction) &&
      veteranNightAction.alerted === true;
    const veteranAlertsUsed =
      (ts.roleState?.veteran?.alertsUsed ?? 0) +
      (veteranAlertedThisNight ? 1 : 0);

    // The Thing tap: record the tapped player ID so they see the notification
    // during the following daytime.
    const thingAction = nightPhase.nightActions[WerewolfRole.TheThing];
    const thingTapped =
      thingAction !== undefined && !isTeamNightAction(thingAction)
        ? thingAction.targetPlayerId
        : undefined;

    // Arsonist: update the doused player list.
    // If the Arsonist self-targeted (ignite), reset the doused list.
    // If the Arsonist targeted another player (douse), add them to the list.
    const arsonistDousedPlayerIds = computeArsonistDousedPlayerIds(
      nightPhase.nightActions,
      game.roleAssignments,
      rs,
      updatedDeadIds,
    );

    const wolfCubDied =
      rs.wolfCub?.died === true || didWolfCubDie(newDeadIds, game);
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

    game.status = {
      type: GameStatus.Playing,
      turnState: {
        turn: ts.turn,
        phase: {
          type: WerewolfPhase.Daytime,
          startedAt: Date.now(),
          nightActions: nightPhase.nightActions,
          revealedPlayerIds,
          ...(nightResolution.length > 0 ? { nightResolution } : {}),
          ...(newExposerReveal ? { exposerReveal: newExposerReveal } : {}),
          ...(knightedPlayerId !== undefined ? { knightedPlayerId } : {}),
          ...(nightPhase.smitedPlayerIds?.length
            ? { smitedPlayerIds: nightPhase.smitedPlayerIds }
            : {}),
        },
        deadPlayerIds: updatedDeadIds,
        ...(Object.keys(lastTargets).length > 0 ? { lastTargets } : {}),
        ...(ts.roleOverrides ? { roleOverrides: ts.roleOverrides } : {}),
        ...(Object.keys(newRoleState).length > 0
          ? { roleState: newRoleState }
          : {}),
      },
    };

    // Tanner wins immediately if killed at night — checked after turn state
    // is built so all deaths and night resolution are recorded.
    const tannerAssignment = effectiveAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.Tanner as string),
    );
    if (tannerAssignment && newDeadIds.includes(tannerAssignment.playerId)) {
      game.status = {
        type: GameStatus.Finished,
        winner: WerewolfWinner.Tanner,
      };
      return;
    }

    if (!hunterDiedThisNight) {
      const winResult = checkWinCondition(game, updatedDeadIds);
      if (winResult) {
        game.status = winResult;
      }
    }
  },
};
