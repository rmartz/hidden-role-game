import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { WerewolfRole, WEREWOLF_ROLES } from "../roles";
import { applyTrialVerdict } from "./resolve-trial";

export const startTrialAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    if (ts.phase.activeTrial && !ts.phase.activeTrial.verdict) return false;
    const { defendantId } = payload as { defendantId?: unknown };
    if (typeof defendantId !== "string") return false;
    if (defendantId === game.ownerPlayerId) return false;
    if (ts.deadPlayerIds.includes(defendantId)) return false;
    return game.players.some((p) => p.id === defendantId);
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    const { defendantId } = payload as { defendantId: string };

    // Pre-populate guilty votes for Village Idiots (they must always vote guilty)
    const villageIdiotVotes = game.players
      .filter((p) => {
        if (p.id === game.ownerPlayerId) return false;
        if (p.id === defendantId) return false;
        if (ts.deadPlayerIds.includes(p.id)) return false;
        const roleId = game.roleAssignments.find(
          (a) => a.playerId === p.id,
        )?.roleDefinitionId;
        return (
          roleId !== undefined &&
          WEREWOLF_ROLES[roleId as WerewolfRole].alwaysVotesGuilty === true
        );
      })
      .map((p) => ({ playerId: p.id, vote: "guilty" as const }));

    const activeTrial = {
      defendantId,
      startedAt: Date.now(),
      votes: villageIdiotVotes,
    };
    ts.phase.activeTrial = activeTrial;

    // Auto-resolve if Village Idiots account for all eligible votes
    const eligibleCount = game.players.filter(
      (p) =>
        p.id !== game.ownerPlayerId &&
        p.id !== defendantId &&
        !ts.deadPlayerIds.includes(p.id),
    ).length;
    if (activeTrial.votes.length >= eligibleCount) {
      applyTrialVerdict(activeTrial, ts, game);
    }
  },
};
