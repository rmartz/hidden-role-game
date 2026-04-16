import type { Game, GameAction } from "@/lib/types";
import { hasKilledOutcome, hasStatusOutcome } from "../services";
import { NightOutcomeRevealStep, WerewolfPhase } from "../types";
import type { WerewolfDaytimePhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { getWerewolfModeConfig } from "../lobby-config";

/**
 * Advance reveal progression:
 * hidden -> killed -> all
 * If no kills occurred, hidden jumps directly to all.
 */
function resolveNextRevealStep(
  currentStep: NightOutcomeRevealStep,
  phase: WerewolfDaytimePhase,
): NightOutcomeRevealStep {
  const hasKilled = hasKilledOutcome(phase);

  if (currentStep === NightOutcomeRevealStep.Hidden) {
    if (hasKilled) return NightOutcomeRevealStep.Killed;
    return NightOutcomeRevealStep.All;
  }
  return NightOutcomeRevealStep.All;
}

export const revealNightOutcomeStepAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    void payload;
    if (!isOwnerPlaying(game, callerId)) return false;
    if (getWerewolfModeConfig(game).autoRevealNightOutcome) return false;
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return false;
    const phase = ts.phase;
    const hasRevealableOutcome =
      hasKilledOutcome(phase) || hasStatusOutcome(phase);
    if (!hasRevealableOutcome) return false;
    return (
      (phase.nightOutcomeRevealStep ?? NightOutcomeRevealStep.Hidden) !==
      NightOutcomeRevealStep.All
    );
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    const phase = ts.phase;
    const currentStep =
      phase.nightOutcomeRevealStep ?? NightOutcomeRevealStep.Hidden;
    phase.nightOutcomeRevealStep = resolveNextRevealStep(currentStep, phase);
  },
};
