import { GameStatus } from "@/lib/types";
import type { Game, GameModeServices, RoleDefinition } from "@/lib/types";
import type { CodenamesTurnState } from "./types";
import { CodenamesRole } from "./roles";

function currentTurnState(game: Game): CodenamesTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as CodenamesTurnState | undefined;
}

function isCodemasterRole(role: RoleDefinition | undefined): boolean {
  return (
    role?.id === CodenamesRole.RedCodemaster ||
    role?.id === CodenamesRole.BlueCodemaster
  );
}

export const codenamesServices: GameModeServices = {
  buildInitialTurnState(): undefined {
    return undefined;
  },

  selectSpecialTargets(): Record<string, string> {
    return {};
  },

  extractPlayerState(
    game: Game,
    _callerId: string,
    myRole: RoleDefinition | undefined,
  ): Record<string, unknown> {
    const ts = currentTurnState(game);
    if (!ts) return {};

    const { board, clueHistory, turn, phase, activeTeam, startingTeam } = ts;

    // Guessers see only revealed cards (word + revealed state, no color for unrevealed).
    // Codemasters see the full key card (all card colors).
    const visibleBoard = isCodemasterRole(myRole)
      ? board
      : board.map(({ word, revealed, revealedBy, color }) =>
          revealed ? { word, revealed, revealedBy, color } : { word, revealed },
        );

    return {
      board: visibleBoard,
      clueHistory,
      codenamesTurn: turn,
      codenamesPhase: phase,
      activeTeam,
      startingTeam,
    };
  },
};
