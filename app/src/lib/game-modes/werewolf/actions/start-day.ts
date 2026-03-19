import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase, isTeamNightAction } from "../types";
import type { NightAction, WerewolfNighttimePhase } from "../types";
import {
  currentTurnState,
  isOwnerPlaying,
  resolveNightActions,
  checkWinCondition,
} from "../utils";
import { WEREWOLF_ROLES, WerewolfRole } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";
import { didWolfCubDie } from "./helpers";

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
    const priestAction = nightPhase.nightActions[
      WerewolfRole.Priest as string
    ] as NightAction | undefined;
    if (priestAction?.targetPlayerId) {
      const priestPlayerId = game.roleAssignments.find(
        (a) => a.roleDefinitionId === (WerewolfRole.Priest as string),
      )?.playerId;
      if (priestPlayerId) {
        priestWardsForResolution[priestAction.targetPlayerId] = priestPlayerId;
      }
    }

    const nightResolution = resolveNightActions(
      nightPhase.nightActions,
      game.roleAssignments,
      ts.deadPlayerIds,
      {
        priestWards: priestWardsForResolution,
        toughGuyHitIds: ts.toughGuyHitIds,
      },
    );
    const newDeadIds = nightResolution
      .filter((e) => e.type === "killed" && e.died)
      .map((e) => e.targetPlayerId);

    // Track Tough Guy hits: players who absorbed an attack this night.
    const newToughGuyHitIds = nightResolution
      .filter((e) => e.type === "tough-guy-absorbed")
      .map((e) => e.targetPlayerId);
    const toughGuyHitIds = [...(ts.toughGuyHitIds ?? []), ...newToughGuyHitIds];

    // Consume priest wards for any warded player who was attacked this night,
    // regardless of whether other protections also saved them.
    const attackedPlayerIds = new Set(
      nightResolution
        .filter((e) => e.type === "killed")
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

    // Build lastTargets for roles that prevent consecutive same-player targeting.
    const lastTargets: Record<string, string> = {};
    for (const [phaseKey, action] of Object.entries(nightPhase.nightActions)) {
      if (isTeamNightAction(action)) continue;
      const roleDef = (
        WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>
      )[phaseKey];
      if (roleDef?.preventRepeatTarget && action.targetPlayerId) {
        lastTargets[phaseKey] = action.targetPlayerId;
      }
    }

    const updatedDeadIds = [...ts.deadPlayerIds, ...newDeadIds];
    const winResult = checkWinCondition(game, updatedDeadIds);
    if (winResult) {
      game.status = winResult;
      return;
    }

    // Extract the Mummy's hypnotized target for this day phase.
    const mummyAction = nightPhase.nightActions[
      WerewolfRole.Mummy as string
    ] as NightAction | undefined;
    const mummyHypnotizedId = mummyAction?.targetPlayerId;

    const wolfCubDied =
      ts.wolfCubDied === true || didWolfCubDie(newDeadIds, game);
    game.status = {
      type: GameStatus.Playing,
      turnState: {
        turn: ts.turn,
        phase: {
          type: WerewolfPhase.Daytime,
          startedAt: Date.now(),
          nightActions: nightPhase.nightActions,
          ...(nightResolution.length > 0 ? { nightResolution } : {}),
        },
        deadPlayerIds: updatedDeadIds,
        ...(ts.witchAbilityUsed ? { witchAbilityUsed: true } : {}),
        ...(Object.keys(lastTargets).length > 0 ? { lastTargets } : {}),
        ...(wolfCubDied ? { wolfCubDied: true } : {}),
        ...(Object.keys(priestWards).length > 0 ? { priestWards } : {}),
        ...(toughGuyHitIds.length > 0 ? { toughGuyHitIds } : {}),
        ...(mummyHypnotizedId ? { mummyHypnotizedId } : {}),
      },
    };
  },
};
