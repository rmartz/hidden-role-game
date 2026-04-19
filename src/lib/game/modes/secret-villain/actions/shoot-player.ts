import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { SecretVillainPhase, SpecialActionType } from "../types";
import {
  currentTurnState,
  checkShootWinCondition,
  SvVictoryConditionKey,
} from "../utils";
import { advanceToNextElection } from "./advance-to-election";

/**
 * President shoots (eliminates) a player. If the target is the Special
 * Bad, the Good team wins immediately.
 */
export const shootPlayerAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.SpecialAction) return false;
    if (ts.phase.actionType !== SpecialActionType.Shoot) return false;
    if (ts.phase.presidentId !== callerId) return false;
    if (ts.phase.resolved) return false;

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
    ts.eliminatedPlayerIds = [...ts.eliminatedPlayerIds, targetPlayerId];

    // Check if the Special Bad was shot — Good team wins.
    const shootWin = checkShootWinCondition(
      targetPlayerId,
      game.roleAssignments,
    );
    if (shootWin) {
      game.status = {
        type: GameStatus.Finished,
        winner: shootWin.winner,
        victoryConditionKey: SvVictoryConditionKey.GoodShoot,
      };
      return;
    }

    advanceToNextElection(game);
  },
};
