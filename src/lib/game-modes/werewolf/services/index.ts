import type {
  Game,
  GameModeServices,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/types";
import type { WerewolfPlayerGameState } from "../player-state";
import { WerewolfRole } from "../roles";
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
    myRole.id === (WerewolfRole.Executioner as string)
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
    const modeState = !myRole
      ? (extractOwnerState(game) as Record<string, unknown>)
      : (extractNonOwnerState(game, callerId, myRole) as Record<
          string,
          unknown
        >);

    // Include Werewolf-specific game settings in the player state.
    return {
      ...modeState,
      nominationsEnabled: game.nominationsEnabled as unknown,
      singleTrialPerDay: game.singleTrialPerDay as unknown,
      revealProtections: game.revealProtections as unknown,
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
