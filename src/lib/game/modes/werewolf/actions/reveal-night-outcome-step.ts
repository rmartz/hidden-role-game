import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { NightOutcomeRevealStep, WerewolfDaytimePhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { getWerewolfModeConfig } from "../lobby-config";

/** True when at least one player died during the previous night. */
function hasKilledOutcome(phase: WerewolfDaytimePhase): boolean {
  return (phase.nightResolution ?? []).some(
    (event) => event.type === "killed" && event.died,
  );
}

/** True when at least one player was silenced or hypnotized during the night. */
function hasStatusOutcome(phase: WerewolfDaytimePhase): boolean {
  return (phase.nightResolution ?? []).some(
    (event) => event.type === "silenced" || event.type === "hypnotized",
  );
}

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

  if (currentStep === "hidden") {
    if (hasKilled) return "killed";
    return "all";
  }
  return "all";
}

export const revealNightOutcomeStepAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    if (getWerewolfModeConfig(game).autoRevealNightOutcome) return false;
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return false;
    const phase = ts.phase;
    const hasRevealableOutcome =
      hasKilledOutcome(phase) || hasStatusOutcome(phase);
    if (!hasRevealableOutcome) return false;
    return (phase.nightOutcomeRevealStep ?? "hidden") !== "all";
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    const phase = ts.phase;
    const currentStep = phase.nightOutcomeRevealStep ?? "hidden";
    phase.nightOutcomeRevealStep = resolveNextRevealStep(currentStep, phase);
  },
};
