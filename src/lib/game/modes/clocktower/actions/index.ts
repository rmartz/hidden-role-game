export { ClocktowerAction } from "./types";
import type { GameAction } from "@/lib/types";
import { ClocktowerAction } from "./types";
import { advanceNightStepAction } from "./advance-night-step";
import { castPublicVoteAction } from "./cast-public-vote";
import { closeNominationsAction } from "./close-nominations";
import { confirmNightTargetAction } from "./confirm-night-target";
import { nominatePlayerAction } from "./nominate-player";
import { provideInformationAction } from "./provide-information";
import { resolveNightAction } from "./resolve-night";
import { setNightTargetAction } from "./set-night-target";

export const CLOCKTOWER_ACTIONS: Record<ClocktowerAction, GameAction> = {
  [ClocktowerAction.AdvanceNightStep]: advanceNightStepAction,
  [ClocktowerAction.CastPublicVote]: castPublicVoteAction,
  [ClocktowerAction.CloseNominations]: closeNominationsAction,
  [ClocktowerAction.ConfirmNightTarget]: confirmNightTargetAction,
  [ClocktowerAction.NominatePlayer]: nominatePlayerAction,
  [ClocktowerAction.ProvideInformation]: provideInformationAction,
  [ClocktowerAction.ResolveNight]: resolveNightAction,
  [ClocktowerAction.SetNightTarget]: setNightTargetAction,
};
