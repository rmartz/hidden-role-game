import type {
  Game,
  GameModeServices,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/types";
import type { WerewolfPlayerGameState } from "../player-state";
import { getWerewolfModeConfig } from "../lobby-config";
import { WerewolfRole, getWerewolfRole } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";
import {
  selectExecutionerTarget,
  buildInitialTurnState,
} from "./initialization";
import {
  extractOwnerState,
  extractNightActions,
  extractDeadPlayerIds,
  extractDaytimeNightSummary,
  extractDaytimePlayerState,
} from "./owner-state";
import { extractPlayerNightState } from "./player-night-state";

function extractNonOwnerState(
  game: Game,
  callerId: string,
  myRole: WerewolfRoleDefinition,
): Partial<WerewolfPlayerGameState> & { modeVisiblePlayerIds?: string[] } {
  const deadPlayerIds = extractDeadPlayerIds(game);
  const nightActions = extractNightActions(game);

  const nightTargetState = nightActions
    ? extractPlayerNightState(game, callerId, myRole, deadPlayerIds)
    : {};

  const daytimeNightState = extractDaytimeNightSummary(game, callerId);
  const daytimePlayerState = extractDaytimePlayerState(game, callerId);

  const amDead = deadPlayerIds.includes(callerId);

  // Executioner: surface the target so the player knows who to get eliminated,
  // and mark the target as visible (name only, no role).
  const executionerTargetId =
    myRole.id === WerewolfRole.Executioner
      ? game.executionerTargetId
      : undefined;
  const executionerState = executionerTargetId
    ? {
        executionerTargetId,
        modeVisiblePlayerIds: [executionerTargetId],
      }
    : {};

  return {
    ...nightTargetState,
    ...daytimeNightState,
    ...daytimePlayerState,
    ...(amDead ? { amDead: true } : {}),
    ...(deadPlayerIds.length > 0 ? { deadPlayerIds } : {}),
    ...executionerState,
  };
}

export const werewolfServices: GameModeServices = {
  buildInitialTurnState(
    roleAssignments: PlayerRoleAssignment[],
    options?: Record<string, unknown>,
  ): unknown {
    return buildInitialTurnState(roleAssignments, options);
  },

  selectSpecialTargets(
    roleAssignments: PlayerRoleAssignment[],
  ): Record<string, string> {
    const executionerTargetId = selectExecutionerTarget(roleAssignments);
    if (!executionerTargetId) return {};
    return { executionerTargetId };
  },

  extractPlayerState(
    game: Game,
    callerId: string,
    myRole: RoleDefinition | undefined,
  ): Record<string, unknown> {
    let modeState: Record<string, unknown>;
    if (!myRole) {
      modeState = extractOwnerState(game) as Record<string, unknown>;
    } else {
      const werewolfRole = getWerewolfRole(myRole.id);
      if (!werewolfRole) {
        throw new Error(`Unknown Werewolf role ID: ${myRole.id}`);
      }
      modeState = extractNonOwnerState(game, callerId, werewolfRole) as Record<
        string,
        unknown
      >;
    }

    // Include Werewolf-specific game settings in the player state.
    const wwConfig = getWerewolfModeConfig(game);
    return {
      ...modeState,
      nominationsEnabled: wwConfig.nominationsEnabled as unknown,
      singleTrialPerDay: wwConfig.singleTrialPerDay as unknown,
      revealProtections: wwConfig.revealProtections as unknown,
    };
  },
};

export {
  extractOwnerState,
  extractNightActions,
  extractDeadPlayerIds,
  extractDaytimeNightSummary,
  extractDaytimePlayerState,
} from "./owner-state";
export { extractPlayerNightState } from "./player-night-state";
export {
  selectExecutionerTarget,
  buildInitialTurnState,
} from "./initialization";
