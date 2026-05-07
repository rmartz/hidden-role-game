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
import { smitePlayerAction } from "./smite-player";
import { unsmitePlayerAction } from "./unsmite-player";
import { nominatePlayerAction } from "./nominate-player";
import { withdrawNominationAction } from "./withdraw-nomination";
import { skipDefenseAction } from "./skip-defense";
import { killPlayerAction } from "./kill-player";
import { resolveHunterRevengeAction } from "./resolve-hunter-revenge";
import { cancelTrialAction } from "./cancel-trial";
import { resetAbilityAction } from "./reset-ability";
import { submitGhostClueAction } from "./submit-ghost-clue";

export const WEREWOLF_ACTIONS: Record<WerewolfAction, GameAction> = {
  [WerewolfAction.StartNight]: startNightAction,
  [WerewolfAction.StartDay]: startDayAction,
  [WerewolfAction.SetNightPhase]: setNightPhaseAction,
  [WerewolfAction.SetNightTarget]: setNightTargetAction,
  [WerewolfAction.ConfirmNightTarget]: confirmNightTargetAction,
  [WerewolfAction.RevealInvestigationResult]: revealInvestigationResultAction,
  [WerewolfAction.RevealNightOutcomeStep]: revealNightOutcomeStepAction,
  [WerewolfAction.MarkPlayerDead]: markPlayerDeadAction,
  [WerewolfAction.MarkPlayerAlive]: markPlayerAliveAction,
  [WerewolfAction.StartTrial]: startTrialAction,
  [WerewolfAction.CastVote]: castVoteAction,
  [WerewolfAction.ResolveTrial]: resolveTrialAction,
  [WerewolfAction.EndGame]: endGameAction,
  [WerewolfAction.SmitePlayer]: smitePlayerAction,
  [WerewolfAction.UnsmitePlayer]: unsmitePlayerAction,
  [WerewolfAction.NominatePlayer]: nominatePlayerAction,
  [WerewolfAction.WithdrawNomination]: withdrawNominationAction,
  [WerewolfAction.SkipDefense]: skipDefenseAction,
  [WerewolfAction.KillPlayer]: killPlayerAction,
  [WerewolfAction.ResolveHunterRevenge]: resolveHunterRevengeAction,
  [WerewolfAction.CancelTrial]: cancelTrialAction,
  [WerewolfAction.ResetAbility]: resetAbilityAction,
  [WerewolfAction.SubmitGhostClue]: submitGhostClueAction,
};
