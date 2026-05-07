export { WerewolfAction } from "./types";
import type { GameAction } from "@/lib/types";
import { WerewolfAction } from "./types";
import { startNightAction } from "./start-night";
import { startDayAction } from "./start-day";
import { setNightPhaseAction } from "./set-night-phase";
import { setNightTargetAction } from "./set-night-target";
import { confirmNightTargetAction } from "./confirm-night-target";
import { revealInvestigationResultAction } from "./reveal-investigation-result";
import { revealNightOutcomeStepAction } from "./reveal-night-outcome-step";
import { markPlayerDeadAction, markPlayerAliveAction } from "./mark-player";
import { startTrialAction } from "./start-trial";
import { castVoteAction } from "./cast-vote";
import { resolveTrialAction } from "./resolve-trial";
import { endGameAction } from "./end-game";
import { pauseTimerAction } from "./pause-timer";
import { resumeTimerAction } from "./resume-timer";
import { smitePlayerAction } from "./smite-player";
import { unsmitePlayerAction } from "./unsmite-player";
import { nominatePlayerAction } from "./nominate-player";
import { withdrawNominationAction } from "./withdraw-nomination";
import { skipDefenseAction } from "./skip-defense";
import { killPlayerAction } from "./kill-player";
import { resolveHunterRevengeAction } from "./resolve-hunter-revenge";
import { cancelTrialAction } from "./cancel-trial";
import { resetAbilityAction } from "./reset-ability";
import { setIllusionTargetAction } from "./set-illusion-target";
import { confirmEvilEmpathResultAction } from "./confirm-evil-empath-result";

export const WEREWOLF_ACTIONS: Record<WerewolfAction, GameAction> = {
  [WerewolfAction.CancelTrial]: cancelTrialAction,
  [WerewolfAction.CastVote]: castVoteAction,
  [WerewolfAction.ConfirmEvilEmpathResult]: confirmEvilEmpathResultAction,
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
  [WerewolfAction.SetIllusionTarget]: setIllusionTargetAction,
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
