import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { WEREWOLF_ROLES, isWerewolfRole } from "../roles";

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

    // Pre-populate guilty votes for roles that must always vote guilty
    const precastGuiltyVotes = game.players
      .filter((p) => {
        if (p.id === game.ownerPlayerId) return false;
        if (p.id === defendantId) return false;
        if (ts.deadPlayerIds.includes(p.id)) return false;
        const roleId = game.roleAssignments.find(
          (a) => a.playerId === p.id,
        )?.roleDefinitionId;
        return (
          roleId !== undefined &&
          isWerewolfRole(roleId) &&
          WEREWOLF_ROLES[roleId].alwaysVotesGuilty === true
        );
      })
      .map((p) => ({ playerId: p.id, vote: "guilty" as const }));

    const activeTrial = {
      defendantId,
      startedAt: Date.now(),
      phase: "defense" as const,
      votes: precastGuiltyVotes,
    };
    ts.phase.activeTrial = activeTrial;
    // Clear all nominations when a trial begins
    ts.phase.nominations = [];
  },
};
