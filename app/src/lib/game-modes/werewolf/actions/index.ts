export { WerewolfAction } from "./types";
import type { GameAction } from "@/lib/types";
import { WerewolfAction } from "./types";
import { startNightAction } from "./start-night";
import { startDayAction } from "./start-day";
import { setNightPhaseAction } from "./set-night-phase";
import { setNightTargetAction } from "./set-night-target";
import { confirmNightTargetAction } from "./confirm-night-target";
import { revealInvestigationResultAction } from "./reveal-investigation-result";
import { markPlayerDeadAction, markPlayerAliveAction } from "./mark-player";

export const WEREWOLF_ACTIONS: Record<WerewolfAction, GameAction> = {
  [WerewolfAction.StartNight]: startNightAction,
  [WerewolfAction.StartDay]: startDayAction,
  [WerewolfAction.SetNightPhase]: setNightPhaseAction,
  [WerewolfAction.SetNightTarget]: setNightTargetAction,
  [WerewolfAction.ConfirmNightTarget]: confirmNightTargetAction,
  [WerewolfAction.RevealInvestigationResult]: revealInvestigationResultAction,
  [WerewolfAction.MarkPlayerDead]: markPlayerDeadAction,
  [WerewolfAction.MarkPlayerAlive]: markPlayerAliveAction,
};
