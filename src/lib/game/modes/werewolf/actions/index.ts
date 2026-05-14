export { WerewolfAction } from "./types";
import type { GameAction } from "@/lib/types";

import { alphaWolfBiteAction } from "./alpha-wolf-bite";
import { cancelTrialAction } from "./cancel-trial";
import { castVoteAction } from "./cast-vote";
import { confirmNightTargetAction } from "./confirm-night-target";
import { endGameAction } from "./end-game";
import { killPlayerAction } from "./kill-player";
import { markPlayerAliveAction, markPlayerDeadAction } from "./mark-player";
import { nominatePlayerAction } from "./nominate-player";
import { pauseTimerAction } from "./pause-timer";
import { resetAbilityAction } from "./reset-ability";
import { resolveHunterRevengeAction } from "./resolve-hunter-revenge";
import { resolveTrialAction } from "./resolve-trial";
import { resumeTimerAction } from "./resume-timer";
import { revealInvestigationResultAction } from "./reveal-investigation-result";
import { revealNightOutcomeStepAction } from "./reveal-night-outcome-step";
import { setNightPhaseAction } from "./set-night-phase";
import { setNightTargetAction } from "./set-night-target";
import { skipDefenseAction } from "./skip-defense";
import { smitePlayerAction } from "./smite-player";
import { startDayAction } from "./start-day";
import { startNightAction } from "./start-night";
import { startTrialAction } from "./start-trial";
import { WerewolfAction } from "./types";
import { unsmitePlayerAction } from "./unsmite-player";
import { withdrawNominationAction } from "./withdraw-nomination";

export const WEREWOLF_ACTIONS: Record<WerewolfAction, GameAction> = {
  [WerewolfAction.AlphaWolfBite]: alphaWolfBiteAction,
  [WerewolfAction.CancelTrial]: cancelTrialAction,
  [WerewolfAction.CastVote]: castVoteAction,
  [WerewolfAction.ConfirmNightTarget]: confirmNightTargetAction,
  [WerewolfAction.EndGame]: endGameAction,
  [WerewolfAction.KillPlayer]: killPlayerAction,
  [WerewolfAction.MarkPlayerAlive]: markPlayerAliveAction,
  [WerewolfAction.MarkPlayerDead]: markPlayerDeadAction,
  [WerewolfAction.NominatePlayer]: nominatePlayerAction,
  [WerewolfAction.PauseTimer]: pauseTimerAction,
  [WerewolfAction.ResetAbility]: resetAbilityAction,
  [WerewolfAction.ResolveHunterRevenge]: resolveHunterRevengeAction,
  [WerewolfAction.ResolveTrial]: resolveTrialAction,
  [WerewolfAction.ResumeTimer]: resumeTimerAction,
  [WerewolfAction.RevealInvestigationResult]: revealInvestigationResultAction,
  [WerewolfAction.RevealNightOutcomeStep]: revealNightOutcomeStepAction,
  [WerewolfAction.SetNightPhase]: setNightPhaseAction,
  [WerewolfAction.SetNightTarget]: setNightTargetAction,
  [WerewolfAction.SkipDefense]: skipDefenseAction,
  [WerewolfAction.SmitePlayer]: smitePlayerAction,
  [WerewolfAction.StartDay]: startDayAction,
  [WerewolfAction.StartNight]: startNightAction,
  [WerewolfAction.StartTrial]: startTrialAction,
  [WerewolfAction.UnsmitePlayer]: unsmitePlayerAction,
  [WerewolfAction.WithdrawNomination]: withdrawNominationAction,
};
