import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase, isTeamNightAction } from "../types";
import type { WerewolfNighttimePhase } from "../types";
import {
  currentTurnState,
  isOwnerPlaying,
  resolveNightActions,
} from "../utils";
import { WEREWOLF_ROLES } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";
import { isWolfCubDead } from "./helpers";

export const startDayAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    return currentTurnState(game)?.phase.type === WerewolfPhase.Nighttime;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const nightPhase = ts.phase as WerewolfNighttimePhase;
    const nightResolution = resolveNightActions(
      nightPhase.nightActions,
      game.roleAssignments,
      ts.deadPlayerIds,
    );
    const newDeadIds = nightResolution
      .filter((e) => e.type === "killed" && e.died)
      .map((e) => e.targetPlayerId);

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

    const wolfCubDied =
      ts.wolfCubDied === true || isWolfCubDead(newDeadIds, game);
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
        deadPlayerIds: [...ts.deadPlayerIds, ...newDeadIds],
        ...(ts.witchAbilityUsed ? { witchAbilityUsed: true } : {}),
        ...(Object.keys(lastTargets).length > 0 ? { lastTargets } : {}),
        ...(wolfCubDied ? { wolfCubDied: true } : {}),
      },
    };
  },
};
