import type { Game } from "@/lib/types";
import { GameMode } from "@/lib/types";

import type { WerewolfPlayerGameState } from "../player-state";
import { WerewolfPhase } from "../types";
import { currentTurnState } from "../utils/game-state";
import { extractDaytimeNightSummary } from "./owner-daytime-summary";
import {
  extractDeadPlayerIds,
  extractHunterRevengePlayerId,
  extractNightActions,
  resolveRevealedPlayerIds,
} from "./owner-state-helpers";

/**
 * Extracts complete owner/narrator state from the Werewolf game.
 */
export function extractOwnerState(
  game: Game,
): Partial<WerewolfPlayerGameState> {
  const ts = currentTurnState(game);
  const nightActions = extractNightActions(game);
  const deadPlayerIds = extractDeadPlayerIds(game);
  const hunterRevengePlayerId = extractHunterRevengePlayerId(game);
  const monarchKnightingsUsed = ts?.roleState?.monarch?.knightingsUsed;
  const callerId = game.ownerPlayerId ?? "";
  const daytimeNightState = extractDaytimeNightSummary(game, callerId);

  // hiddenRoleIds is only present on WerewolfGame when hiddenRoleCount > 0.
  const hiddenRoleIds =
    game.gameMode === GameMode.Werewolf && game.hiddenRoleIds?.length
      ? game.hiddenRoleIds
      : undefined;

  // mercenaryBribedPlayerIds is narrator-only: lets the narrator track which
  // players have been bribed across nights when running a no-device Mercenary.
  const mercenaryBribedPlayerIds = ts?.roleState?.mercenary?.bribedPlayerIds
    .length
    ? ts.roleState.mercenary.bribedPlayerIds
    : undefined;

  return {
    ...(nightActions ? { nightActions } : {}),
    ...daytimeNightState,
    ...(deadPlayerIds.length > 0 ? { deadPlayerIds } : {}),
    ...(hunterRevengePlayerId ? { hunterRevengePlayerId } : {}),
    ...(game.executionerTargetId
      ? { executionerTargetId: game.executionerTargetId }
      : {}),
    ...(ts?.roleState?.monarch?.knightedPlayerIds.length
      ? { monarchKnightedPlayerIds: ts.roleState.monarch.knightedPlayerIds }
      : {}),
    ...((monarchKnightingsUsed ?? 0) > 0 ? { monarchKnightingsUsed } : {}),
    ...(hiddenRoleIds ? { hiddenRoleIds } : {}),
    ...(mercenaryBribedPlayerIds ? { mercenaryBribedPlayerIds } : {}),
  };
}

/**
 * Returns dead players visible to a specific caller.
 * During manual night-outcome reveal, newly killed players remain hidden from
 * other players until the narrator reveals eliminations, while the affected
 * player and narrator still see their own elimination immediately.
 */
export function extractVisibleDeadPlayerIds(
  game: Game,
  callerId: string,
): string[] {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== WerewolfPhase.Daytime) {
    return ts?.deadPlayerIds ?? [];
  }
  if (callerId === game.ownerPlayerId) return ts.deadPlayerIds;

  const revealedPlayerIds = resolveRevealedPlayerIds(game);
  const deadThisNight = new Set<string>();
  for (const event of ts.phase.nightResolution ?? []) {
    if (event.type === "killed" && event.died) {
      deadThisNight.add(event.targetPlayerId);
    }
  }

  // Deaths from previous nights are always visible; this night's kills are
  // visible only once the narrator reveals that player (or they see themselves).
  const visible = ts.deadPlayerIds.filter(
    (id) => !deadThisNight.has(id) || revealedPlayerIds.has(id),
  );
  if (deadThisNight.has(callerId) && !revealedPlayerIds.has(callerId)) {
    return [...visible, callerId];
  }
  return visible;
}

export { extractDaytimePlayerState } from "./owner-daytime-state";
export { extractDaytimeNightSummary } from "./owner-daytime-summary";
export {
  extractDeadPlayerIds,
  extractNightActions,
} from "./owner-state-helpers";
