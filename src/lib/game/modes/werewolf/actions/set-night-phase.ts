import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";

import { WerewolfRole } from "../roles";
import type { WerewolfNighttimePhase } from "../types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { confirmEvilEmpathResultAction } from "./confirm-evil-empath-result";

export const setNightPhaseAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;
    if (!payload || typeof payload !== "object") return false;
    const { phaseIndex } = payload as { phaseIndex?: unknown };
    return (
      typeof phaseIndex === "number" &&
      phaseIndex >= 0 &&
      phaseIndex < ts.phase.nightPhaseOrder.length
    );
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;
    if (!payload || typeof payload !== "object") return;
    const { phaseIndex } = payload as { phaseIndex: number };
    const phase = ts.phase as WerewolfNighttimePhase;
    const departingPhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
    const arrivingPhaseKey = phase.nightPhaseOrder[phaseIndex];
    // Departure fallback: auto-compute the Evil Empath result when leaving their
    // phase, in case entry computation could not run (e.g. Evil Empath is the
    // first phase and the night started at index 0 without an explicit entry).
    // Skip if already computed via confirmEvilEmpathResultAction or start-night.
    const departingAction = phase.nightActions[departingPhaseKey ?? ""];
    const alreadyComputedByEvilEmpathAction =
      departingPhaseKey === (WerewolfRole.EvilEmpath as string) &&
      departingAction &&
      !("votes" in departingAction) &&
      departingAction.confirmed === true &&
      departingAction.resultRevealed === true;
    if (
      departingPhaseKey === (WerewolfRole.EvilEmpath as string) &&
      !alreadyComputedByEvilEmpathAction
    ) {
      confirmEvilEmpathResultAction.apply(game, {}, "");
    }
    // Re-read turnState after confirmEvilEmpathResultAction may have mutated it.
    const updatedTs = currentTurnState(game);
    if (!updatedTs) return;
    const updatedPhase = updatedTs.phase as WerewolfNighttimePhase;
    game.status = {
      type: GameStatus.Playing,
      turnState: {
        ...updatedTs,
        phase: {
          ...updatedPhase,
          currentPhaseIndex: phaseIndex,
          startedAt: Date.now(),
          pausedAt: undefined,
          pauseOffset: undefined,
        },
      },
    };
    // Entry compute: auto-compute the Evil Empath adjacency result when entering
    // their phase so the result is immediately visible to the player during
    // their active phase. This is the primary compute path; departure above is
    // a fallback for when the phase starts at index 0 (no prior entry call).
    if (arrivingPhaseKey === (WerewolfRole.EvilEmpath as string)) {
      confirmEvilEmpathResultAction.apply(game, {}, "");
    }
  },
};
