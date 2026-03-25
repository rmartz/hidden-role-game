import { Team } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { SecretVillainPhase, SpecialActionType } from "../types";
import { currentTurnState } from "../utils";
import { SECRET_VILLAIN_ROLES } from "../roles";
import { advanceToNextElection } from "./advance-to-election";

/**
 * President selects a player to investigate. Sets targetPlayerId on the
 * SpecialAction phase.
 */
export const selectInvestigationTargetAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.SpecialAction) return false;
    if (ts.phase.actionType !== SpecialActionType.InvestigateTeam) return false;
    if (ts.phase.presidentId !== callerId) return false;
    if (ts.phase.targetPlayerId !== undefined) return false;

    const { targetPlayerId } = payload as { targetPlayerId?: unknown };
    if (typeof targetPlayerId !== "string") return false;
    if (targetPlayerId === callerId) return false;
    if (ts.eliminatedPlayerIds.includes(targetPlayerId)) return false;
    return game.players.some((p) => p.id === targetPlayerId);
  },

  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== SecretVillainPhase.SpecialAction) return;

    const { targetPlayerId } = payload as { targetPlayerId: string };
    ts.phase.targetPlayerId = targetPlayerId;
  },
};

/**
 * Target player consents to reveal their team. Looks up the target's
 * role and sets revealedTeam to "Good" or "Bad".
 */
export const consentInvestigationAction: GameAction = {
  isValid(game: Game, callerId: string) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.SpecialAction) return false;
    if (ts.phase.actionType !== SpecialActionType.InvestigateTeam) return false;
    if (ts.phase.targetPlayerId !== callerId) return false;
    return ts.phase.targetConsented !== true;
  },

  apply(game: Game, _payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== SecretVillainPhase.SpecialAction) return;

    ts.phase.targetConsented = true;

    const assignment = game.roleAssignments.find(
      (a) => a.playerId === callerId,
    );
    if (!assignment) return;

    const roleDef = (SECRET_VILLAIN_ROLES as Record<string, { team: Team }>)[
      assignment.roleDefinitionId
    ];
    ts.phase.revealedTeam = roleDef?.team === Team.Good ? "Good" : "Bad";
  },
};

/**
 * President acknowledges the investigation result. Resolves the action
 * and advances to the next election.
 */
export const resolveInvestigationAction: GameAction = {
  isValid(game: Game, callerId: string) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.SpecialAction) return false;
    if (ts.phase.actionType !== SpecialActionType.InvestigateTeam) return false;
    if (ts.phase.presidentId !== callerId) return false;
    return ts.phase.targetConsented === true;
  },

  apply(game: Game) {
    advanceToNextElection(game);
  },
};
