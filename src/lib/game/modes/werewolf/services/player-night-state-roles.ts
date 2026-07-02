import type { Game } from "@/lib/types";
import { Team } from "@/lib/types";

import type { WerewolfPlayerGameState } from "../player-state";
import type { WerewolfRoleDefinition } from "../roles";
import { getWerewolfRole, WerewolfRole } from "../roles";
import type { AnyNightAction, WerewolfTurnState } from "../types";
import { isTeamNightAction } from "../types";
import {
  extractCountState,
  extractInsomniacState,
  extractTheThingState,
} from "./player-night-state-positional";
import {
  extractAltruistState,
  extractWitchState,
} from "./player-night-state-protection";

/**
 * Extracts night targeting state for roles with bespoke solo behavior.
 * Returns undefined when the role has no special handling and should fall
 * through to the generic solo extraction.
 */
export function extractRoleSpecificState(
  game: Game,
  callerId: string,
  myRole: WerewolfRoleDefinition,
  nightActions: Record<string, AnyNightAction>,
  deadPlayerIds: string[],
  ts: WerewolfTurnState | undefined,
): Partial<WerewolfPlayerGameState> | undefined {
  if (myRole.id === WerewolfRole.Exposer) {
    const exposerAction = nightActions[myRole.id];
    const soloAction =
      exposerAction && !isTeamNightAction(exposerAction)
        ? exposerAction
        : undefined;
    return {
      myNightTarget: soloAction?.skipped ? null : soloAction?.targetPlayerId,
      myNightTargetConfirmed: soloAction?.confirmed ?? false,
      exposerAbilityUsed: ts?.roleState?.exposer?.abilityUsed ?? false,
    };
  }

  if (myRole.id === WerewolfRole.Mortician) {
    const morticianAction = nightActions[myRole.id];
    const soloAction =
      morticianAction && !isTeamNightAction(morticianAction)
        ? morticianAction
        : undefined;
    return {
      myNightTarget: soloAction?.skipped ? null : soloAction?.targetPlayerId,
      myNightTargetConfirmed: soloAction?.confirmed ?? false,
      morticianAbilityEnded: ts?.roleState?.mortician?.abilityEnded ?? false,
    };
  }

  if (myRole.id === WerewolfRole.Witch) {
    return extractWitchState(game, nightActions, myRole, deadPlayerIds, ts);
  }

  if (myRole.id === WerewolfRole.Altruist) {
    return extractAltruistState(
      game,
      callerId,
      nightActions,
      myRole,
      deadPlayerIds,
      ts,
    );
  }

  if (myRole.id === WerewolfRole.Mirrorcaster) {
    const mcAction = nightActions[myRole.id];
    const soloAction =
      mcAction && !isTeamNightAction(mcAction) ? mcAction : undefined;
    return {
      myNightTarget: soloAction?.skipped ? null : soloAction?.targetPlayerId,
      myNightTargetConfirmed: soloAction?.confirmed ?? false,
      mirrorcasterCharged: ts?.roleState?.mirrorcaster?.charged ?? false,
    };
  }

  if (myRole.id === WerewolfRole.Mercenary) {
    const mercAction = nightActions[myRole.id];
    const soloAction =
      mercAction && !isTeamNightAction(mercAction) ? mercAction : undefined;
    return {
      myNightTarget: soloAction?.skipped ? null : soloAction?.targetPlayerId,
      myNightTargetConfirmed: soloAction?.confirmed ?? false,
      mercenaryCharged: ts?.roleState?.mercenary?.charged ?? false,
    };
  }

  if (myRole.id === WerewolfRole.Veteran) {
    const vetAction = nightActions[myRole.id];
    const soloAction =
      vetAction && !isTeamNightAction(vetAction) ? vetAction : undefined;
    return {
      myNightTarget: soloAction?.skipped ? null : undefined,
      myNightTargetConfirmed: soloAction?.confirmed ?? false,
      veteranAlertsUsed: ts?.roleState?.veteran?.alertsUsed ?? 0,
      myNightAlerted: soloAction?.alerted === true,
    };
  }

  if (myRole.id === WerewolfRole.Executioner) {
    return {
      myNightTarget: undefined,
      myNightTargetConfirmed: false,
      ...(ts?.roleState?.executioner?.targetId
        ? { executionerTargetId: ts.roleState.executioner.targetId }
        : {}),
    };
  }

  if (myRole.id === WerewolfRole.TheThing) {
    return extractTheThingState(game, callerId, nightActions, ts);
  }

  if (myRole.id === WerewolfRole.Insomniac) {
    return extractInsomniacState(game, callerId, nightActions);
  }

  if (myRole.id === WerewolfRole.Count) {
    return extractCountState(game, ts);
  }

  if (myRole.id === WerewolfRole.Arsonist) {
    const arsonistAction = nightActions[myRole.id];
    const soloAction =
      arsonistAction && !isTeamNightAction(arsonistAction)
        ? arsonistAction
        : undefined;
    return {
      myNightTarget: soloAction?.skipped ? null : soloAction?.targetPlayerId,
      myNightTargetConfirmed: soloAction?.confirmed ?? false,
      ...(ts?.roleState?.arsonist?.dousedPlayerIds.length
        ? { arsonistDousedPlayerIds: ts.roleState.arsonist.dousedPlayerIds }
        : {}),
    };
  }

  if (myRole.id === WerewolfRole.OneEyedSeer) {
    const lockedTargetId = ts?.roleState?.oneEyedSeer?.lockedTargetId;
    if (lockedTargetId && !ts.deadPlayerIds.includes(lockedTargetId)) {
      return {
        myNightTarget: undefined,
        myNightTargetConfirmed: false,
        oneEyedSeerLockedTargetId: lockedTargetId,
      };
    }
  }

  if (myRole.id === WerewolfRole.ElusiveSeer) {
    if (ts?.turn === 1) {
      const elusiveSeerVillagerIds = game.roleAssignments
        .filter((a) => a.roleDefinitionId === (WerewolfRole.Villager as string))
        .map((a) => a.playerId);
      return {
        myNightTarget: undefined,
        myNightTargetConfirmed: false,
        elusiveSeerVillagerIds,
      };
    }
  }

  if (myRole.id === WerewolfRole.Illuminati) {
    const illuminatiAction = nightActions[myRole.id];
    const soloAction =
      illuminatiAction && !isTeamNightAction(illuminatiAction)
        ? illuminatiAction
        : undefined;
    if (soloAction?.resultRevealed) {
      const illuminatiRoleAssignments = game.roleAssignments.map((a) => {
        const roleDef = getWerewolfRole(a.roleDefinitionId);
        return {
          playerId: a.playerId,
          roleName: roleDef?.name ?? a.roleDefinitionId,
          team: roleDef?.team ?? Team.Good,
        };
      });
      return {
        myNightTarget: undefined,
        myNightTargetConfirmed: false,
        illuminatiRoleAssignments,
      };
    }
    return {
      myNightTarget: undefined,
      myNightTargetConfirmed: false,
    };
  }

  if (myRole.id === WerewolfRole.EvilEmpath) {
    const empathAction = nightActions[myRole.id];
    const soloAction =
      empathAction && !isTeamNightAction(empathAction)
        ? empathAction
        : undefined;
    return {
      myNightTarget: undefined,
      myNightTargetConfirmed: soloAction?.confirmed ?? false,
      ...(soloAction?.confirmed &&
      ts?.roleState?.evilEmpath?.lastResult !== undefined
        ? { evilEmpathNightResult: ts.roleState.evilEmpath.lastResult }
        : {}),
    };
  }

  return undefined;
}
