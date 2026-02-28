import type { Game } from "../../lib/models";

export class GameListService {
    private games: Record<string, Game> = {};

    public addGame(game: Game) {
        this.games[game.id] = game;
    }

    public getGame(gameId: string): Game | undefined {
        return this.games[gameId];
    }
}
