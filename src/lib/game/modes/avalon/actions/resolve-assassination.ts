import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";
import { AvalonPhase } from "../types";
import type { AvalonTurnState } from "../types";
import { AvalonRole } from "../roles";

function currentTurnState(game: Game): AvalonTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as AvalonTurnState | undefined;
}

function findMerlinPlayerId(game: Game): string | undefined {
  const merlinId: string = AvalonRole.Merlin;
  const assignment = game.roleAssignments.find(
    (a) => a.roleDefinitionId === merlinId,
  );
  return assignment?.playerId;
}

/**
 * Resolve the assassination attempt:
 * - If the target is Merlin → Evil wins (assassination succeeded).
 * - If the target is not Merlin → Good wins (assassination failed).
 * Requires a target to have been selected first.
 */
export const resolveAssassinationAction: GameAction = {
  isValid(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== AvalonPhase.Assassination) return false;
    // Target must be selected
    if (!ts.phase.targetPlayerId) return false;
    // Cannot resolve twice
    return ts.phase.correct === undefined;
  },

  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== AvalonPhase.Assassination) return;
    if (!ts.phase.targetPlayerId) return;

    const merlinPlayerId = findMerlinPlayerId(game);
    const correct = ts.phase.targetPlayerId === merlinPlayerId;

    ts.phase.correct = correct;

    game.status = {
      type: GameStatus.Finished,
      winner: correct ? "Bad" : "Good",
      victoryConditionKey: correct ? "assassination" : "assassination-failed",
    };
  },
};
