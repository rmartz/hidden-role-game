import type { Game, GameAction } from "@/lib/types";

import { WerewolfRole } from "../roles";
import { WerewolfPhase } from "../types";
import { currentTurnState, validateActiveNightPlayer } from "../utils";

/**
 * Illusion Artist night action: target one player whose Seer investigation
 * result will be inverted for this night only.
 * The confirmation step is handled by the generic confirmNightTargetAction.
 * At start-day, the confirmed target is lifted out of nightActions into
 * roleState.illusionArtist.illusionTargetId for use in Seer result resolution.
 *
 * Skip / deselect path: this action only accepts a valid targetPlayerId — it
 * cannot clear an already-set target or represent a skip. To deselect or skip,
 * the client must use the generic setNightTargetAction with `targetPlayerId:
 * null` (skipped: true). The Illusion Artist phase is optional, so skipping via
 * that path is always valid.
 */
export const setIllusionTargetAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const result = validateActiveNightPlayer(game, callerId);
    if (!result) return false;
    if (result.isGroupPhase) return false;
    if (result.activePhaseKey !== (WerewolfRole.IllusionArtist as string))
      return false;

    if (!payload || typeof payload !== "object") return false;
    const { targetPlayerId } = payload as { targetPlayerId?: unknown };
    if (typeof targetPlayerId !== "string") return false;
    if (targetPlayerId === callerId) return false;
    // Narrator cannot be targeted — they have no role assignment and cannot
    // be an investigation target, matching the restriction in set-night-target.ts.
    if (targetPlayerId === game.ownerPlayerId) return false;
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;
    const existing =
      result.phase.nightActions[WerewolfRole.IllusionArtist as string];
    if (existing && !("votes" in existing) && existing.confirmed) return false;
    if (ts.deadPlayerIds.includes(targetPlayerId)) return false;

    // Prevent targeting the same player on consecutive nights.
    const lastTarget = ts.lastTargets?.[WerewolfRole.IllusionArtist as string];
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
    const existing = phase.nightActions[activePhaseKey];
    const resultRevealed =
      existing && !("votes" in existing) && !existing.skipped
        ? existing.resultRevealed
        : undefined;
    phase.nightActions[activePhaseKey] = {
      targetPlayerId,
      ...(resultRevealed !== undefined ? { resultRevealed } : {}),
    };
  },
};
