import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { getWerewolfModeConfig } from "../lobby-config";

function hasKilledOutcome(game: Game): boolean {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== WerewolfPhase.Daytime) return false;
  return (ts.phase.nightResolution ?? []).some(
    (event) => event.type === "killed" && event.died,
  );
}

function hasStatusOutcome(game: Game): boolean {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== WerewolfPhase.Daytime) return false;
  return (ts.phase.nightResolution ?? []).some(
    (event) => event.type === "silenced" || event.type === "hypnotized",
  );
}

function resolveNextRevealStep(
  currentStep: "hidden" | "killed" | "all",
  game: Game,
): "hidden" | "killed" | "all" {
  const hasKilled = hasKilledOutcome(game);
  const hasStatus = hasStatusOutcome(game);

  if (currentStep === "hidden") {
    if (hasKilled) return "killed";
    if (hasStatus) return "all";
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
    const hasRevealableOutcome =
      hasKilledOutcome(game) || hasStatusOutcome(game);
    if (!hasRevealableOutcome) return false;
    return (ts.phase.nightOutcomeRevealStep ?? "hidden") !== "all";
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    const currentStep = ts.phase.nightOutcomeRevealStep ?? "hidden";
    ts.phase.nightOutcomeRevealStep = resolveNextRevealStep(currentStep, game);
  },
};
