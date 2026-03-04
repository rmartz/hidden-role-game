import { DefaultService, OpenAPI } from "./generated";
import type {
  ServerResponse_PublicLobby_,
  ServerResponse_LobbyJoinResponse_,
  PublicLobbyPlayer,
} from "./generated";

export type LobbyResponse = ServerResponse_PublicLobby_;
export type JoinResponse = ServerResponse_LobbyJoinResponse_;
export type GamePlayer = PublicLobbyPlayer;

const SESSION_KEY = "x-session-id";

export class ApiClient {
  constructor(baseUrl: string = "http://localhost:7001") {
    OpenAPI.BASE = baseUrl;
  }

  async createLobby(playerName: string): Promise<JoinResponse> {
    const response = await DefaultService.createLobby({ playerName });
    if (response.status === "success") {
      localStorage.setItem(SESSION_KEY, response.data.sessionId);
    }
    return response;
  }

  getLobby(lobbyId: string): Promise<LobbyResponse> {
    return DefaultService.getLobby(
      lobbyId,
      localStorage.getItem(SESSION_KEY) ?? undefined,
    );
  }

  async joinLobby(lobbyId: string, playerName: string): Promise<JoinResponse> {
    const response = await DefaultService.joinLobby(lobbyId, { playerName });
    if (response.status === "success") {
      localStorage.setItem(SESSION_KEY, response.data.sessionId);
    }
    return response;
  }
}
