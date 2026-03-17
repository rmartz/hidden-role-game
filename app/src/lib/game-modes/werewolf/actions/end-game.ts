import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { currentTurnState, isOwnerPlaying, checkWinCondition } from "../utils";

export const endGameAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    return game.status.type === GameStatus.Playing;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    const deadPlayerIds = ts?.deadPlayerIds ?? [];
    const winResult = checkWinCondition(game, deadPlayerIds);
    game.status = winResult ?? { type: GameStatus.Finished };
  },
};
