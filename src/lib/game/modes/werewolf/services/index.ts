import type {
  Game,
  GameModeServices,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/types";
import { GameStatus, Team } from "@/lib/types";
import type { VictoryCondition } from "@/server/types/game";

import { WEREWOLF_COPY } from "../copy";
import { getWerewolfModeConfig } from "../lobby-config";
import type { WerewolfPlayerGameState } from "../player-state";
import type { WerewolfRoleDefinition } from "../roles";
import { getWerewolfRole, WerewolfRole } from "../roles";
import { WerewolfPhase } from "../types";
import { currentTurnState } from "../utils";
import { WerewolfWinner } from "../utils/win-condition";
import {
  buildInitialTurnState,
  selectExecutionerTarget,
} from "./initialization";
import {
  extractDaytimeNightSummary,
  extractDaytimePlayerState,
  extractDeadPlayerIds,
  extractNightActions,
  extractOwnerState,
  extractVisibleDeadPlayerIds,
} from "./owner-state";
import { extractPlayerNightState } from "./player-night-state";

const WEREWOLF_WINNER_TEAMS = {
  [WerewolfWinner.Arsonist]: Team.Neutral,
  [WerewolfWinner.Village]: Team.Good,
  [WerewolfWinner.Werewolves]: Team.Bad,
  [WerewolfWinner.Tanner]: Team.Neutral,
  [WerewolfWinner.Draw]: Team.Neutral,
  [WerewolfWinner.Chupacabra]: Team.Neutral,
  [WerewolfWinner.Dracula]: Team.Neutral,
  [WerewolfWinner.LoneWolf]: Team.Neutral,
  [WerewolfWinner.Mercenary]: Team.Neutral,
  [WerewolfWinner.Spoiler]: Team.Neutral,
  [WerewolfWinner.Executioner]: Team.Neutral,
  [WerewolfWinner.Zombie]: Team.Neutral,
  [WerewolfWinner.Illuminati]: Team.Neutral,
} satisfies Record<WerewolfWinner, Team>;

function extractVictoryCondition(game: Game): VictoryCondition | undefined {
  if (game.status.type !== GameStatus.Finished) return undefined;
  const winner = game.status.winner as WerewolfWinner | undefined;
  if (!winner) return undefined;
  const label = WEREWOLF_COPY.gameOver.victoryConditions[winner];
  if (!label) return undefined;
  return { label, winner: WEREWOLF_WINNER_TEAMS[winner] };
}

function extractMercenaryAlsoWins(game: Game): boolean {
  if (game.status.type !== GameStatus.Finished) return false;
  return (
    game.status.victoryConditionKey === (WerewolfWinner.Mercenary as string)
  );
}

function extractNonOwnerState(
  game: Game,
  callerId: string,
  myRole: WerewolfRoleDefinition,
): Partial<WerewolfPlayerGameState> & { modeVisiblePlayerIds?: string[] } {
  const deadPlayerIds = extractDeadPlayerIds(game);
  const nightActions = extractNightActions(game);

  const amDead = deadPlayerIds.includes(callerId);

  // Ghost: when dead and it's nighttime, grant narrator-level visibility.
  const isGhost = myRole.id === WerewolfRole.Ghost;
  const isNighttime =
    currentTurnState(game)?.phase.type === WerewolfPhase.Nighttime;
  const ghostVisible = isGhost && amDead && isNighttime;
  const ghostNightState =
    ghostVisible && nightActions ? { ghostVisible: true, nightActions } : {};

  const nightTargetState =
    nightActions && !ghostVisible
      ? extractPlayerNightState(game, callerId, myRole, deadPlayerIds)
      : {};

  const daytimeNightState = extractDaytimeNightSummary(game, callerId);
  const daytimePlayerState = extractDaytimePlayerState(game, callerId);
  const ts = currentTurnState(game);
  const monarchKnightingsUsed = ts?.roleState?.monarch?.knightingsUsed;

  const visibleDeadPlayerIds = extractVisibleDeadPlayerIds(game, callerId);

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

  // Alpha Wolf: surface bite status and role conversions to werewolf-team players.
  // Only include entries where the override is WerewolfRole.Werewolf (Alpha Wolf bites);
  // Village Drunk sober transitions must not be visible to other players.
  const isWerewolfTeam = myRole.isWerewolf === true || myRole.team === Team.Bad;
  const wolfTeamState: Partial<WerewolfPlayerGameState> = {};
  if (isWerewolfTeam && ts) {
    if (ts.roleState?.alphaWolf?.biteUsed)
      wolfTeamState.alphaWolfBiteUsed = true;
    const biteConversions = ts.roleOverrides
      ? Object.entries(ts.roleOverrides).filter(
          ([, newRoleDefinitionId]) =>
            newRoleDefinitionId === (WerewolfRole.Werewolf as string),
        )
      : [];
    if (biteConversions.length > 0) {
      wolfTeamState.roleConversions = biteConversions.map(
        ([playerId, newRoleDefinitionId]) => ({
          playerId,
          newRoleDefinitionId,
        }),
      );
    }
  }

  return {
    ...nightTargetState,
    ...ghostNightState,
    ...daytimeNightState,
    ...daytimePlayerState,
    ...(amDead ? { amDead: true } : {}),
    ...(visibleDeadPlayerIds.length > 0
      ? { deadPlayerIds: visibleDeadPlayerIds }
      : {}),
    ...(ts?.roleState?.monarch?.knightedPlayerIds.length
      ? { monarchKnightedPlayerIds: ts.roleState.monarch.knightedPlayerIds }
      : {}),
    ...((monarchKnightingsUsed ?? 0) > 0 ? { monarchKnightingsUsed } : {}),
    ...executionerState,
    ...wolfTeamState,
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
      modeState = extractOwnerState(game);
    } else {
      const werewolfRole = getWerewolfRole(myRole.id);
      if (!werewolfRole) {
        throw new Error(`Unknown Werewolf role ID: ${myRole.id}`);
      }
      modeState = extractNonOwnerState(game, callerId, werewolfRole);
    }

    // Include Werewolf-specific game settings in the player state.
    const wwConfig = getWerewolfModeConfig(game);
    const mercenaryAlsoWins = extractMercenaryAlsoWins(game);
    return {
      ...modeState,
      nominationsEnabled: wwConfig.nominationsEnabled,
      trialsPerDay: wwConfig.trialsPerDay,
      revealProtections: wwConfig.revealProtections,
      autoRevealNightOutcome: wwConfig.autoRevealNightOutcome,
      victoryCondition: extractVictoryCondition(game),
      ...(mercenaryAlsoWins ? { mercenaryAlsoWins: true } : {}),
    };
  },
};

export {
  buildInitialTurnState,
  selectExecutionerTarget,
} from "./initialization";
export type { AffectedPlayerOutcome } from "./night-outcome";
export {
  getOrderedAffectedPlayerIds,
  getOrderedAffectedPlayers,
} from "./night-outcome";
export { NightOutcomeEffect } from "./night-outcome";
export {
  extractDaytimeNightSummary,
  extractDaytimePlayerState,
  extractDeadPlayerIds,
  extractNightActions,
  extractOwnerState,
  extractVisibleDeadPlayerIds,
} from "./owner-state";
export { extractPlayerNightState } from "./player-night-state";
