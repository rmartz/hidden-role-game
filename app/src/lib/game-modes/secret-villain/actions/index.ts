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
import { presidentDiscardAction } from "./president-discard";
import { resolveElectionAction } from "./resolve-election";
import { shootPlayerAction } from "./shoot-player";

export enum SecretVillainAction {
  CallSpecialElection = "call-special-election",
  CastElectionVote = "cast-election-vote",
  ChancellorPlay = "chancellor-play",
  ConsentInvestigation = "consent-investigation",
  NominateChancellor = "nominate-chancellor",
  PresidentDiscard = "president-discard",
  ResolveElection = "resolve-election",
  ResolveInvestigation = "resolve-investigation",
  SelectInvestigationTarget = "select-investigation-target",
  ShootPlayer = "shoot-player",
}

export const SECRET_VILLAIN_ACTIONS: Record<SecretVillainAction, GameAction> = {
  [SecretVillainAction.CallSpecialElection]: callSpecialElectionAction,
  [SecretVillainAction.CastElectionVote]: castElectionVoteAction,
  [SecretVillainAction.ChancellorPlay]: chancellorPlayAction,
  [SecretVillainAction.ConsentInvestigation]: consentInvestigationAction,
  [SecretVillainAction.NominateChancellor]: nominateChancellorAction,
  [SecretVillainAction.PresidentDiscard]: presidentDiscardAction,
  [SecretVillainAction.ResolveElection]: resolveElectionAction,
  [SecretVillainAction.ResolveInvestigation]: resolveInvestigationAction,
  [SecretVillainAction.SelectInvestigationTarget]:
    selectInvestigationTargetAction,
  [SecretVillainAction.ShootPlayer]: shootPlayerAction,
};
