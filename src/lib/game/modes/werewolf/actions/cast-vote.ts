import type { Game, GameAction } from "@/lib/types";
import { DaytimeVote, TrialPhase } from "../types";
import { WerewolfPhase } from "../types";
import {
  currentTurnState,
  checkWinCondition,
  getSilencedPlayerIds,
  getHypnotizedPlayerId,
} from "../utils";
import { WEREWOLF_ROLES, WerewolfRole, isWerewolfRole } from "../roles";
import { applyTrialVerdict } from "./resolve-trial";

const VALID_VOTES: DaytimeVote[] = [DaytimeVote.Guilty, DaytimeVote.Innocent];

export const castVoteAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    // Only non-owner alive players may vote
    if (callerId === game.ownerPlayerId) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    const { activeTrial } = ts.phase;
    if (!activeTrial) return false;
    if (activeTrial.phase !== TrialPhase.Voting) return false;
    if (activeTrial.verdict) return false;
    if (ts.deadPlayerIds.includes(callerId)) return false;
    if (!game.players.some((p) => p.id === callerId)) return false;
    if (activeTrial.defendantId === callerId) return false;
    // Silenced players cannot vote in trials
    const silencedIds = getSilencedPlayerIds(ts);
    if (silencedIds.includes(callerId)) return false;
    // Hypnotized players cannot vote manually (their vote follows the Mummy)
    if (getHypnotizedPlayerId(ts) === callerId) return false;
    const { vote } = payload as { vote?: unknown };
    if (typeof vote !== "string" || !VALID_VOTES.includes(vote as DaytimeVote))
      return false;
    const callerRoleId = game.roleAssignments.find(
      (a) => a.playerId === callerId,
    )?.roleDefinitionId;
    // Roles with alwaysVotesGuilty must always vote guilty
    if (
      callerRoleId !== undefined &&
      isWerewolfRole(callerRoleId) &&
      WEREWOLF_ROLES[callerRoleId].alwaysVotesGuilty &&
      (vote as DaytimeVote) !== DaytimeVote.Guilty
    )
      return false;
    // Roles with alwaysVotesInnocent must always vote innocent
    if (
      callerRoleId !== undefined &&
      isWerewolfRole(callerRoleId) &&
      WEREWOLF_ROLES[callerRoleId].alwaysVotesInnocent &&
      (vote as DaytimeVote) !== DaytimeVote.Innocent
    )
      return false;
    return true;
  },
  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    const { activeTrial } = ts.phase;
    if (!activeTrial) return;
    const { vote } = payload as { vote: DaytimeVote };
    activeTrial.votes = [
      ...activeTrial.votes.filter((v) => v.playerId !== callerId),
      { playerId: callerId, vote },
    ];

    // When the Mummy votes, auto-cast the hypnotized player's vote to match
    const callerRoleId = game.roleAssignments.find(
      (a) => a.playerId === callerId,
    )?.roleDefinitionId;
    const hypnotizedId = getHypnotizedPlayerId(ts);
    const silencedIds = getSilencedPlayerIds(ts);
    if (callerRoleId === (WerewolfRole.Mummy as string) && hypnotizedId) {
      if (
        !silencedIds.includes(hypnotizedId) &&
        !ts.deadPlayerIds.includes(hypnotizedId) &&
        hypnotizedId !== activeTrial.defendantId
      ) {
        activeTrial.votes = [
          ...activeTrial.votes.filter((v) => v.playerId !== hypnotizedId),
          { playerId: hypnotizedId, vote },
        ];
      }
    }

    // Auto-resolve when every eligible player (alive, non-owner, non-defendant,
    // non-silenced) has voted. Silenced players cannot vote at all.
    const eligibleCount = game.players.filter(
      (p) =>
        p.id !== game.ownerPlayerId &&
        p.id !== activeTrial.defendantId &&
        !ts.deadPlayerIds.includes(p.id) &&
        !silencedIds.includes(p.id),
    ).length;
    if (activeTrial.votes.length >= eligibleCount) {
      applyTrialVerdict(activeTrial, ts, game);
      const winResult = checkWinCondition(game, ts.deadPlayerIds);
      if (winResult) {
        game.status = winResult;
      }
    }
  },
};
