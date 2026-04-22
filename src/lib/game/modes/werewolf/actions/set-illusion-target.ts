import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, validateActiveNightPlayer } from "../utils";
import { WerewolfRole } from "../roles";

/**
 * Illusion Artist night action: target one player whose Seer investigation
 * result will be inverted for this night only.
 * The confirmation step is handled by the generic confirmNightTargetAction.
 * At start-day, the confirmed target is lifted out of nightActions into
 * illusionTargetId on the turn state for use in Seer result resolution.
 */
export const setIllusionTargetAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const result = validateActiveNightPlayer(game, callerId);
    if (!result) return false;
    if (result.isGroupPhase) return false;
    if (result.activePhaseKey !== (WerewolfRole.IllusionArtist as string))
      return false;

    const { targetPlayerId } = payload as { targetPlayerId?: unknown };
    if (typeof targetPlayerId !== "string") return false;
    if (targetPlayerId === callerId) return false;
    const ts = currentTurnState(game);
    if (ts?.deadPlayerIds.includes(targetPlayerId)) return false;

    // Prevent targeting the same player on consecutive nights.
    const lastTarget = ts?.lastTargets?.[WerewolfRole.IllusionArtist as string];
    if (lastTarget === targetPlayerId) return false;

    return game.players.some((p) => p.id === targetPlayerId);
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return;
    const phase = ts.phase;
    const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
    if (!activePhaseKey) return;
    const { targetPlayerId } = payload as { targetPlayerId: string };
    phase.nightActions[activePhaseKey] = { targetPlayerId };
  },
};
