import type { GameAction } from "@/lib/types";
import { nominateChancellorAction } from "./nominate-chancellor";
import { castElectionVoteAction } from "./cast-election-vote";
import { resolveElectionAction } from "./resolve-election";

export enum SecretVillainAction {
  NominateChancellor = "nominate-chancellor",
  CastElectionVote = "cast-election-vote",
  ResolveElection = "resolve-election",
}

export const SECRET_VILLAIN_ACTIONS: Record<SecretVillainAction, GameAction> = {
  [SecretVillainAction.NominateChancellor]: nominateChancellorAction,
  [SecretVillainAction.CastElectionVote]: castElectionVoteAction,
  [SecretVillainAction.ResolveElection]: resolveElectionAction,
};
