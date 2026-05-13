import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfNighttimePhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { WerewolfRole } from "../roles";
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
    // Auto-compute the Evil Empath adjacency result whenever departing the
    // Evil Empath phase. We skip only if the action was already confirmed
    // via confirmEvilEmpathResultAction (indicated by resultRevealed being
    // set), because the generic set-night-target/confirm-night-target flow
    // can produce a confirmed action without computing the result.
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
    game.status = {
      type: GameStatus.Playing,
      turnState: {
        ...ts,
        phase: {
          ...phase,
          currentPhaseIndex: phaseIndex,
          startedAt: Date.now(),
          pausedAt: undefined,
          pauseOffset: undefined,
        },
      },
    };
  },
};
