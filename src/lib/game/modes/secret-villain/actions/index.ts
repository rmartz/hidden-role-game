import type { GameAction } from "@/lib/types";
import { callSpecialElectionAction } from "./call-special-election";
import { castElectionVoteAction } from "./cast-election-vote";
import { chancellorPlayAction } from "./chancellor-play";
import {
  consentInvestigationAction,
  resolveInvestigationAction,
  selectInvestigationTargetAction,
} from "./investigate-player";
import { nominateChancellorAction } from "./nominate-chancellor";
import { policyPeekAction, resolvePolicyPeekAction } from "./policy-peek";
import { presidentDrawAction } from "./president-draw";
import { presidentDiscardAction } from "./president-discard";
import { proposeVetoAction, respondVetoAction } from "./veto";
import {
  advanceFromElectionAction,
  resolveElectionAction,
} from "./resolve-election";
import { shootPlayerAction } from "./shoot-player";
import {
  advanceFromSpecialBadRevealAction,
  confirmSpecialBadAction,
  revealSpecialBadAction,
} from "./special-bad-reveal";

export enum SecretVillainAction {
  AdvanceFromElection = "advance-from-election",
  AdvanceFromSpecialBadReveal = "advance-from-special-bad-reveal",
  CallSpecialElection = "call-special-election",
  CastElectionVote = "cast-election-vote",
  ConfirmSpecialBad = "confirm-special-bad",
  RevealSpecialBad = "reveal-special-bad",
  ChancellorPlay = "chancellor-play",
  ConsentInvestigation = "consent-investigation",
  NominateChancellor = "nominate-chancellor",
  PolicyPeek = "policy-peek",
  PresidentDraw = "president-draw",
  PresidentDiscard = "president-discard",
  ProposeVeto = "propose-veto",
  ResolveElection = "resolve-election",
  ResolveInvestigation = "resolve-investigation",
  ResolvePolicyPeek = "resolve-policy-peek",
  RespondVeto = "respond-veto",
  SelectInvestigationTarget = "select-investigation-target",
  ShootPlayer = "shoot-player",
}

export const SECRET_VILLAIN_ACTIONS: Record<SecretVillainAction, GameAction> = {
  [SecretVillainAction.AdvanceFromElection]: advanceFromElectionAction,
  [SecretVillainAction.AdvanceFromSpecialBadReveal]:
    advanceFromSpecialBadRevealAction,
  [SecretVillainAction.CallSpecialElection]: callSpecialElectionAction,
  [SecretVillainAction.CastElectionVote]: castElectionVoteAction,
  [SecretVillainAction.ChancellorPlay]: chancellorPlayAction,
  [SecretVillainAction.ConfirmSpecialBad]: confirmSpecialBadAction,
  [SecretVillainAction.ConsentInvestigation]: consentInvestigationAction,
  [SecretVillainAction.RevealSpecialBad]: revealSpecialBadAction,
  [SecretVillainAction.NominateChancellor]: nominateChancellorAction,
  [SecretVillainAction.PolicyPeek]: policyPeekAction,
  [SecretVillainAction.PresidentDraw]: presidentDrawAction,
  [SecretVillainAction.PresidentDiscard]: presidentDiscardAction,
  [SecretVillainAction.ProposeVeto]: proposeVetoAction,
  [SecretVillainAction.ResolveElection]: resolveElectionAction,
  [SecretVillainAction.ResolveInvestigation]: resolveInvestigationAction,
  [SecretVillainAction.ResolvePolicyPeek]: resolvePolicyPeekAction,
  [SecretVillainAction.RespondVeto]: respondVetoAction,
  [SecretVillainAction.SelectInvestigationTarget]:
    selectInvestigationTargetAction,
  [SecretVillainAction.ShootPlayer]: shootPlayerAction,
};
