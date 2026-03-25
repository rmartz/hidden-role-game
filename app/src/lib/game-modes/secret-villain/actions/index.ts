import type { GameAction } from "@/lib/types";
import { nominateChancellorAction } from "./nominate-chancellor";
import { castElectionVoteAction } from "./cast-election-vote";
import { resolveElectionAction } from "./resolve-election";
import { presidentDiscardAction } from "./president-discard";
import { chancellorPlayAction } from "./chancellor-play";

export enum SecretVillainAction {
  CastElectionVote = "cast-election-vote",
  ChancellorPlay = "chancellor-play",
  NominateChancellor = "nominate-chancellor",
  PresidentDiscard = "president-discard",
  ResolveElection = "resolve-election",
}

export const SECRET_VILLAIN_ACTIONS: Record<SecretVillainAction, GameAction> = {
  [SecretVillainAction.CastElectionVote]: castElectionVoteAction,
  [SecretVillainAction.ChancellorPlay]: chancellorPlayAction,
  [SecretVillainAction.NominateChancellor]: nominateChancellorAction,
  [SecretVillainAction.PresidentDiscard]: presidentDiscardAction,
  [SecretVillainAction.ResolveElection]: resolveElectionAction,
};
