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

export enum SecretVillainAction {
  AdvanceFromElection = "advance-from-election",
  CallSpecialElection = "call-special-election",
  CastElectionVote = "cast-election-vote",
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
  [SecretVillainAction.CallSpecialElection]: callSpecialElectionAction,
  [SecretVillainAction.CastElectionVote]: castElectionVoteAction,
  [SecretVillainAction.ChancellorPlay]: chancellorPlayAction,
  [SecretVillainAction.ConsentInvestigation]: consentInvestigationAction,
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
