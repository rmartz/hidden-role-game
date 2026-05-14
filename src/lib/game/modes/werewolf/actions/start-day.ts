import { GameStatus, Team } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase, isTeamNightAction } from "../types";
import type {
  AttackNightResolutionEvent,
  ToughGuyAbsorbedNightResolutionEvent,
  WerewolfNighttimePhase,
  WerewolfRoleTurnState,
} from "../types";
import {
  currentTurnState,
  isOwnerPlaying,
  resolveNightActions,
  checkWinCondition,
  WerewolfWinner,
} from "../utils";
import { WerewolfRole, getWerewolfRole } from "../roles";
import { didWolfCubDie } from "./helpers";
import { getWerewolfModeConfig } from "../lobby-config";
import { getOrderedAffectedPlayerIds } from "../services";

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
      const priestPlayerId = game.roleAssignments.find(
        (a) => a.roleDefinitionId === (WerewolfRole.Priest as string),
      )?.playerId;
      if (priestPlayerId) {
        priestWardsForResolution[priestAction.targetPlayerId] = priestPlayerId;
      }
    }

    // Old Man timer: fires after (#werewolves + 2) nights.
    const werewolfCount = game.roleAssignments.filter((a) => {
      const roleDef = getWerewolfRole(a.roleDefinitionId);
      return roleDef?.isWerewolf === true;
    }).length;
    const oldManAssignment = game.roleAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.OldMan as string),
    );
    const oldManTimerPlayerId =
      oldManAssignment &&
      !ts.deadPlayerIds.includes(oldManAssignment.playerId) &&
      ts.turn >= werewolfCount + 2
        ? oldManAssignment.playerId
        : undefined;

    const monarchAction = nightPhase.nightActions[WerewolfRole.Monarch];
    const targetKnightedTonight =
      monarchAction &&
      !isTeamNightAction(monarchAction) &&
      monarchAction.targetPlayerId !== undefined
        ? monarchAction.targetPlayerId
        : undefined;
    const previousMonarchKnightingsUsed = rs.monarch?.knightingsUsed ?? 0;
    const previousMonarchKnightedPlayerIds =
      rs.monarch?.knightedPlayerIds ?? [];
    const monarchCanKnight =
      targetKnightedTonight !== undefined &&
      previousMonarchKnightingsUsed < 3 &&
      !previousMonarchKnightedPlayerIds.includes(targetKnightedTonight);
    const monarchKnightedPlayerIds = monarchCanKnight
      ? [
          ...new Set([
            ...previousMonarchKnightedPlayerIds,
            targetKnightedTonight,
          ]),
        ]
      : previousMonarchKnightedPlayerIds;
    const monarchKnightingsUsed = monarchCanKnight
      ? previousMonarchKnightingsUsed + 1
      : previousMonarchKnightingsUsed;
    const knightedPlayerId = monarchCanKnight
      ? targetKnightedTonight
      : undefined;
    const monarchPlayerId = game.roleAssignments.find(
      (assignment) =>
        assignment.roleDefinitionId === (WerewolfRole.Monarch as string),
    )?.playerId;

    const nightResolution = resolveNightActions(
      nightPhase.nightActions,
      game.roleAssignments,
      ts.deadPlayerIds,
      nightPhase.smitedPlayerIds,
      {
        priestWards: priestWardsForResolution,
        toughGuyHitIds: rs.toughGuy?.hitIds,
        ...(oldManTimerPlayerId ? { oldManTimerPlayerId } : {}),
        ...(rs.mirrorcaster?.charged ? { mirrorcasterCharged: true } : {}),
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
    const attackedPlayerIds = new Set(
      nightResolution
        .filter((e): e is AttackNightResolutionEvent => e.type === "killed")
        .map((e) => e.targetPlayerId),
    );
    const priestWards: Record<string, string> = {};
    for (const [wardedId, priestId] of Object.entries(
      priestWardsForResolution,
    )) {
      if (!attackedPlayerIds.has(wardedId)) {
        priestWards[wardedId] = priestId;
      }
    }

    // One-Eyed Seer lock: if the OES investigated a werewolf this night, lock them on.
    // If the OES's locked target died this night, the lock is cleared (handled below).
    let oneEyedSeerLockedTargetId = rs.oneEyedSeer?.lockedTargetId;
    const oesAction =
      nightPhase.nightActions[WerewolfRole.OneEyedSeer as string];
    if (
      oesAction &&
      !isTeamNightAction(oesAction) &&
      oesAction.confirmed &&
      oesAction.targetPlayerId
    ) {
      const oesTargetAssignment = game.roleAssignments.find(
        (a) => a.playerId === oesAction.targetPlayerId,
      );
      const oesTargetRoleDef = oesTargetAssignment
        ? getWerewolfRole(oesTargetAssignment.roleDefinitionId)
        : undefined;
      if (oesTargetRoleDef?.isWerewolf) {
        oneEyedSeerLockedTargetId = oesAction.targetPlayerId;
      }
    }
    // Clear lock if the locked target died this turn.
    if (
      oneEyedSeerLockedTargetId &&
      newDeadIds.includes(oneEyedSeerLockedTargetId)
    ) {
      oneEyedSeerLockedTargetId = undefined;
    }

    // Exposer reveal: if the Exposer confirmed a target this night, store the reveal.
    let exposerReveal = rs.exposer?.reveal;
    const exposerAction =
      nightPhase.nightActions[WerewolfRole.Exposer as string];
    if (
      exposerAction &&
      !isTeamNightAction(exposerAction) &&
      exposerAction.confirmed &&
      exposerAction.targetPlayerId &&
      !exposerReveal
    ) {
      const exposerTargetAssignment = game.roleAssignments.find(
        (a) => a.playerId === exposerAction.targetPlayerId,
      );
      if (exposerTargetAssignment) {
        exposerReveal = {
          playerId: exposerAction.targetPlayerId,
          roleId: exposerTargetAssignment.roleDefinitionId,
        };
      }
    }

    // Build lastTargets for roles that prevent consecutive same-player targeting.
    const lastTargets: Record<string, string> = {};
    for (const [phaseKey, action] of Object.entries(nightPhase.nightActions)) {
      if (isTeamNightAction(action)) continue;
      const roleDef = getWerewolfRole(phaseKey);
      if (roleDef?.preventRepeatTarget && action.targetPlayerId) {
        lastTargets[phaseKey] = action.targetPlayerId;
      }
    }

    // Vigilante self-death: if the Vigilante killed a Good-team player, they die too.
    // Skip if the Vigilante was already killed this night (e.g. by wolves).
    const vigilanteAssignment = game.roleAssignments.find(
      (a) =>
        a.roleDefinitionId === (WerewolfRole.Vigilante as string) &&
        !ts.deadPlayerIds.includes(a.playerId) &&
        !newDeadIds.includes(a.playerId),
    );
    if (vigilanteAssignment) {
      const vigilanteAction = nightPhase.nightActions[WerewolfRole.Vigilante];
      if (
        vigilanteAction &&
        !isTeamNightAction(vigilanteAction) &&
        vigilanteAction.targetPlayerId
      ) {
        const targetDied = newDeadIds.includes(vigilanteAction.targetPlayerId);
        if (targetDied) {
          const targetAssignment = game.roleAssignments.find(
            (a) => a.playerId === vigilanteAction.targetPlayerId,
          );
          const targetRole = targetAssignment
            ? getWerewolfRole(targetAssignment.roleDefinitionId)
            : undefined;
          if (targetRole?.team === Team.Good) {
            newDeadIds.push(vigilanteAssignment.playerId);
          }
        }
      }
    }

    // Mortician ability: check if the Mortician killed a Werewolf this night.
    let morticianAbilityEnded = rs.mortician?.abilityEnded === true;
    if (!morticianAbilityEnded) {
      const morticianAction = nightPhase.nightActions[WerewolfRole.Mortician];
      if (
        morticianAction &&
        !isTeamNightAction(morticianAction) &&
        morticianAction.targetPlayerId
      ) {
        const morticianKilled = newDeadIds.includes(
          morticianAction.targetPlayerId,
        );
        if (morticianKilled) {
          const targetAssignment = game.roleAssignments.find(
            (a) => a.playerId === morticianAction.targetPlayerId,
          );
          const targetRole = targetAssignment
            ? getWerewolfRole(targetAssignment.roleDefinitionId)
            : undefined;
          if (targetRole?.isWerewolf) {
            morticianAbilityEnded = true;
          }
        }
      }
    }

    // Hunter revenge: if the Hunter died this night, defer win-condition check
    // until the narrator resolves the Hunter's revenge target.
    const hunterAssignment = game.roleAssignments.find(
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
    let mirrorcasterCharged = false;
    if (rs.mirrorcaster?.charged) {
      // Charge is consumed by attacking this night.
      const mcAction =
        nightPhase.nightActions[WerewolfRole.Mirrorcaster as string];
      mirrorcasterCharged =
        mcAction === undefined ||
        isTeamNightAction(mcAction) ||
        mcAction.targetPlayerId === undefined;
    } else {
      // Check if the Mirrorcaster's protection target was attacked.
      const mcAction =
        nightPhase.nightActions[WerewolfRole.Mirrorcaster as string];
      if (
        mcAction !== undefined &&
        !isTeamNightAction(mcAction) &&
        mcAction.targetPlayerId !== undefined
      ) {
        const protectedId = mcAction.targetPlayerId;
        // A "killed" event for the protected player with protectedBy including
        // the Mirrorcaster means the protection was triggered.
        const protectionTriggered = nightResolution.some(
          (e) =>
            e.type === "killed" &&
            e.targetPlayerId === protectedId &&
            e.protectedBy.includes(WerewolfRole.Mirrorcaster),
        );
        mirrorcasterCharged = protectionTriggered;
      }
    }

    const updatedDeadIds = [...ts.deadPlayerIds, ...newDeadIds];

    // Dracula: add the night's wife target to the accumulated list.
    // Exclude the target if they died the same night they were claimed.
    const draculaAction = nightPhase.nightActions[WerewolfRole.Dracula];
    const draculaWives =
      draculaAction &&
      !isTeamNightAction(draculaAction) &&
      draculaAction.targetPlayerId &&
      !updatedDeadIds.includes(draculaAction.targetPlayerId)
        ? [
            ...(rs.dracula?.wives ?? []).filter(
              (id) => !updatedDeadIds.includes(id),
            ),
            ...(rs.dracula?.wives.includes(draculaAction.targetPlayerId)
              ? []
              : [draculaAction.targetPlayerId]),
          ]
        : (rs.dracula?.wives ?? []).filter(
            (id) => !updatedDeadIds.includes(id),
          );

    // Zombie: add the night's infection target to the accumulated list (if not already infected).
    // Exclude the target if they died the same night they were infected.
    const zombieAction = nightPhase.nightActions[WerewolfRole.Zombie];
    const existingInfected = (rs.zombie?.infected ?? []).filter(
      (id) => !updatedDeadIds.includes(id),
    );
    const zombieInfected =
      zombieAction &&
      !isTeamNightAction(zombieAction) &&
      zombieAction.targetPlayerId &&
      !existingInfected.includes(zombieAction.targetPlayerId) &&
      !updatedDeadIds.includes(zombieAction.targetPlayerId)
        ? [...existingInfected, zombieAction.targetPlayerId]
        : existingInfected;

    // Veteran alert usage tracking: increment once per night the Veteran alerts.
    const veteranNightAction = nightPhase.nightActions[WerewolfRole.Veteran];
    const veteranAlertedThisNight =
      veteranNightAction !== undefined &&
      !isTeamNightAction(veteranNightAction) &&
      veteranNightAction.alerted === true;
    const veteranAlertsUsed =
      (ts.roleState?.veteran?.alertsUsed ?? 0) +
      (veteranAlertedThisNight ? 1 : 0);

    // Arsonist: update the doused player list.
    // If the Arsonist self-targeted (ignite), reset the doused list.
    // If the Arsonist targeted another player (douse), add them to the list.
    const arsonistAssignment = game.roleAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.Arsonist as string),
    );
    const arsonistAction = nightPhase.nightActions[WerewolfRole.Arsonist];
    let arsonistDousedPlayerIds = (rs.arsonist?.dousedPlayerIds ?? []).filter(
      (id) => !updatedDeadIds.includes(id),
    );
    if (
      arsonistAssignment &&
      arsonistAction &&
      !isTeamNightAction(arsonistAction) &&
      arsonistAction.targetPlayerId
    ) {
      if (arsonistAction.targetPlayerId === arsonistAssignment.playerId) {
        // Ignite: reset the doused list (regardless of whether the Arsonist died)
        arsonistDousedPlayerIds = [];
      } else if (
        !updatedDeadIds.includes(arsonistAssignment.playerId) &&
        !arsonistDousedPlayerIds.includes(arsonistAction.targetPlayerId) &&
        !updatedDeadIds.includes(arsonistAction.targetPlayerId)
      ) {
        // Douse: add to the list (deduplicated, skip if already dead, skip if Arsonist died)
        arsonistDousedPlayerIds = [
          ...arsonistDousedPlayerIds,
          arsonistAction.targetPlayerId,
        ];
      }
    }

    const wolfCubDied =
      rs.wolfCub?.died === true || didWolfCubDie(newDeadIds, game);
    const revealedPlayerIds = getWerewolfModeConfig(game).autoRevealNightOutcome
      ? getOrderedAffectedPlayerIds(nightResolution)
      : [];

    const newRoleState: WerewolfRoleTurnState = {
      ...(witchAbilityUsed ? { witch: { abilityUsed: true } } : {}),
      ...(wolfCubDied ? { wolfCub: { died: true } } : {}),
      ...(Object.keys(priestWards).length > 0
        ? { priest: { wards: priestWards } }
        : {}),
      ...(toughGuyHitIds.length > 0
        ? { toughGuy: { hitIds: toughGuyHitIds } }
        : {}),
      ...(oneEyedSeerLockedTargetId
        ? { oneEyedSeer: { lockedTargetId: oneEyedSeerLockedTargetId } }
        : {}),
      ...(exposerAbilityUsed || exposerReveal
        ? {
            exposer: {
              ...(exposerAbilityUsed ? { abilityUsed: true as const } : {}),
              ...(exposerReveal ? { reveal: exposerReveal } : {}),
            },
          }
        : {}),
      ...(hunterDiedThisNight
        ? { hunter: { revengePlayerId: hunterAssignment.playerId } }
        : {}),
      ...(morticianAbilityEnded ? { mortician: { abilityEnded: true } } : {}),
      ...(monarchKnightedPlayerIds.length > 0 || monarchKnightingsUsed > 0
        ? {
            monarch: {
              knightedPlayerIds: monarchKnightedPlayerIds,
              knightingsUsed: monarchKnightingsUsed,
            },
          }
        : {}),
      ...(rs.executioner?.targetId
        ? { executioner: { targetId: rs.executioner.targetId } }
        : {}),
      ...(mirrorcasterCharged ? { mirrorcaster: { charged: true } } : {}),
      ...(draculaWives.length > 0 ? { dracula: { wives: draculaWives } } : {}),
      ...(zombieInfected.length > 0
        ? { zombie: { infected: zombieInfected } }
        : {}),
      ...(arsonistDousedPlayerIds.length > 0
        ? { arsonist: { dousedPlayerIds: arsonistDousedPlayerIds } }
        : {}),
      ...(veteranAlertsUsed > 0
        ? { veteran: { alertsUsed: veteranAlertsUsed } }
        : {}),
    };

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
          ...(knightedPlayerId !== undefined ? { knightedPlayerId } : {}),
          ...(nightPhase.smitedPlayerIds?.length
            ? { smitedPlayerIds: nightPhase.smitedPlayerIds }
            : {}),
        },
        deadPlayerIds: updatedDeadIds,
        ...(Object.keys(lastTargets).length > 0 ? { lastTargets } : {}),
        ...(Object.keys(newRoleState).length > 0
          ? { roleState: newRoleState }
          : {}),
      },
    };

    // Tanner wins immediately if killed at night — checked after turn state
    // is built so all deaths and night resolution are recorded.
    const tannerAssignment = game.roleAssignments.find(
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
