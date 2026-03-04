import { DefaultService, OpenAPI } from "./generated";
import type { GameResponse_Lobby_, LobbyPlayer } from "./generated";

export type LobbyResponse = GameResponse_Lobby_;
export type GamePlayer = LobbyPlayer;

export class ApiClient {
  constructor(baseUrl: string = "http://localhost:7001") {
    OpenAPI.BASE = baseUrl;
  }

  createGame(): Promise<LobbyResponse> {
    return DefaultService.createGame();
  }

  getGame(gameId: string): Promise<LobbyResponse> {
    return DefaultService.getGame(gameId);
  }

  joinGame(gameId: string, playerName: string): Promise<LobbyResponse> {
    return DefaultService.joinGame(gameId, { playerName });
  }
}
