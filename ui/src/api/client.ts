import { DefaultService, OpenAPI } from "./generated";
import type { GameResponse_Game_, Player } from "./generated";

export type GameResponse = GameResponse_Game_;
export type GamePlayer = Player;

export class ApiClient {
  constructor(baseUrl: string = "http://localhost:7001") {
    OpenAPI.BASE = baseUrl;
  }

  createGame(): Promise<GameResponse> {
    return DefaultService.createGame();
  }

  getGame(gameId: string): Promise<GameResponse> {
    return DefaultService.getGame(gameId);
  }

  joinGame(gameId: string, playerName: string): Promise<GameResponse> {
    return DefaultService.joinGame(gameId, { playerName });
  }
}
