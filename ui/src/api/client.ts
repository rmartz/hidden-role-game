import { DefaultService, OpenAPI } from "./generated";
import type { ServerResponse_Lobby_, LobbyPlayer } from "./generated";

export type LobbyResponse = ServerResponse_Lobby_;
export type GamePlayer = LobbyPlayer;

export class ApiClient {
  constructor(baseUrl: string = "http://localhost:7001") {
    OpenAPI.BASE = baseUrl;
  }

  createLobby(): Promise<LobbyResponse> {
    return DefaultService.createLobby();
  }

  getLobby(gameId: string): Promise<LobbyResponse> {
    return DefaultService.getLobby(gameId);
  }

  joinLobby(gameId: string, playerName: string): Promise<LobbyResponse> {
    return DefaultService.joinLobby(gameId, { playerName });
  }
}
