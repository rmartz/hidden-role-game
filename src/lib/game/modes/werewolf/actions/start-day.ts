import { GameStatus, Team } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase, isTeamNightAction } from "../types";
import type {
  AttackNightResolutionEvent,
  ToughGuyAbsorbedNightResolutionEvent,
  WerewolfNighttimePhase,
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

    // Build priest wards: carry forward existing wards and add any new ward
    // from this night's Priest action BEFORE resolution so the ward protects
    // the target on the same night it is placed.
    const priestWardsForResolution: Record<string, string> = {
      ...(ts.priestWards ?? {}),
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

    const nightResolution = resolveNightActions(
      nightPhase.nightActions,
      game.roleAssignments,
      ts.deadPlayerIds,
      nightPhase.smitedPlayerIds,
      {
        priestWards: priestWardsForResolution,
        toughGuyHitIds: ts.toughGuyHitIds,
        ...(oldManTimerPlayerId ? { oldManTimerPlayerId } : {}),
        ...(ts.mirrorcasterCharged ? { mirrorcasterCharged: true } : {}),
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
    const toughGuyHitIds = [...(ts.toughGuyHitIds ?? []), ...newToughGuyHitIds];

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
    let oneEyedSeerLockedTargetId = ts.oneEyedSeerLockedTargetId;
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
    let exposerReveal = ts.exposerReveal;
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

    // Illusion Artist: extract the target from this night's action to carry into
    // daytime turn state. Seer result resolution reads illusionTargetId to invert
    // the result when the Seer's target matches this player.
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

    // Evil Empath: carry the last known adjacency result forward so it can be
    // revealed to Werewolves when the Evil Empath dies.
    const evilEmpathLastResult = ts.evilEmpathLastResult;

    // Evil Empath death trigger: if the Evil Empath died this night and there is
    // a last result, set evilEmpathRevealedResult so Werewolves see it.
    const evilEmpathAssignment = game.roleAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.EvilEmpath as string),
    );
    const evilEmpathRevealedResult =
      ts.evilEmpathRevealedResult ??
      (evilEmpathAssignment !== undefined &&
      newDeadIds.includes(evilEmpathAssignment.playerId) &&
      evilEmpathLastResult !== undefined
        ? evilEmpathLastResult
        : undefined);

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
    let morticianAbilityEnded = ts.morticianAbilityEnded === true;
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
      ts.witchAbilityUsed === true ||
      (witchAction !== undefined &&
        !isTeamNightAction(witchAction) &&
        witchAction.targetPlayerId !== undefined);

    const exposerNightAction =
      nightPhase.nightActions[WerewolfRole.Exposer as string];
    const exposerAbilityUsed =
      ts.exposerAbilityUsed === true ||
      (exposerNightAction !== undefined &&
        !isTeamNightAction(exposerNightAction) &&
        exposerNightAction.targetPlayerId !== undefined);

    // Mirrorcaster charge tracking:
    // - If uncharged and the protected target was attacked → gain charge
    // - If charged → charge is consumed (attack was used this night)
    let mirrorcasterCharged = false;
    if (ts.mirrorcasterCharged) {
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
            ...(ts.draculaWives ?? []).filter(
              (id) => !updatedDeadIds.includes(id),
            ),
            ...(ts.draculaWives?.includes(draculaAction.targetPlayerId)
              ? []
              : [draculaAction.targetPlayerId]),
          ]
        : (ts.draculaWives ?? []).filter((id) => !updatedDeadIds.includes(id));

    // Zombie: add the night's infection target to the accumulated list (if not already infected).
    // Exclude the target if they died the same night they were infected.
    const zombieAction = nightPhase.nightActions[WerewolfRole.Zombie];
    const existingInfected = (ts.zombieInfected ?? []).filter(
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

    const wolfCubDied =
      ts.wolfCubDied === true || didWolfCubDie(newDeadIds, game);
    const revealedPlayerIds = getWerewolfModeConfig(game).autoRevealNightOutcome
      ? getOrderedAffectedPlayerIds(nightResolution)
      : [];
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
          ...(nightPhase.smitedPlayerIds?.length
            ? { smitedPlayerIds: nightPhase.smitedPlayerIds }
            : {}),
        },
        deadPlayerIds: updatedDeadIds,
        ...(witchAbilityUsed ? { witchAbilityUsed: true } : {}),
        ...(Object.keys(lastTargets).length > 0 ? { lastTargets } : {}),
        ...(wolfCubDied ? { wolfCubDied: true } : {}),
        ...(Object.keys(priestWards).length > 0 ? { priestWards } : {}),
        ...(toughGuyHitIds.length > 0 ? { toughGuyHitIds } : {}),
        ...(oneEyedSeerLockedTargetId ? { oneEyedSeerLockedTargetId } : {}),
        ...(exposerAbilityUsed ? { exposerAbilityUsed: true } : {}),
        ...(exposerReveal ? { exposerReveal } : {}),
        ...(hunterDiedThisNight
          ? { hunterRevengePlayerId: hunterAssignment.playerId }
          : {}),
        ...(morticianAbilityEnded ? { morticianAbilityEnded: true } : {}),
        ...(ts.executionerTargetId
          ? { executionerTargetId: ts.executionerTargetId }
          : {}),
        ...(mirrorcasterCharged ? { mirrorcasterCharged: true } : {}),
        ...(draculaWives.length > 0 ? { draculaWives } : {}),
        ...(zombieInfected.length > 0 ? { zombieInfected } : {}),
        // illusionTargetId is night-specific — not carried forward to next night.
        ...(illusionTargetId ? { illusionTargetId } : {}),
        ...(evilEmpathLastResult !== undefined ? { evilEmpathLastResult } : {}),
        ...(evilEmpathRevealedResult !== undefined
          ? { evilEmpathRevealedResult }
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
