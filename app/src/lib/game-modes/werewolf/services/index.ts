import type {
  Game,
  GameModeServices,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
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
  myRole: RoleDefinition,
): Partial<PlayerGameState> {
  const deadPlayerIds = extractDeadPlayerIds(game);
  const nightActions = extractNightActions(game);

  const nightTargetState = nightActions
    ? extractPlayerNightState(game, callerId, myRole, deadPlayerIds)
    : {};

  const daytimeNightState = extractDaytimeNightSummary(game, callerId);
  const daytimePlayerState = extractDaytimePlayerState(game, callerId);

  const amDead = deadPlayerIds.includes(callerId);

  return {
    ...nightTargetState,
    ...daytimeNightState,
    ...daytimePlayerState,
    ...(amDead ? { amDead: true } : {}),
    ...(deadPlayerIds.length > 0 ? { deadPlayerIds } : {}),
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
    if (!myRole) {
      return extractOwnerState(game) as Record<string, unknown>;
    }
    return extractNonOwnerState(game, callerId, myRole) as Record<
      string,
      unknown
    >;
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
