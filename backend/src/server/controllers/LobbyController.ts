import {
  Controller,
  Post,
  Get,
  Route,
  Response,
  Body,
  Path,
  Header,
} from "tsoa";
import type { Lobby, LobbyPlayer } from "../../lib/models";
import {
  ServerResponseStatus,
  type ServerError,
  type ServerResponse,
  type PublicLobby,
  type PublicLobbyPlayer,
  type LobbyJoinResponse,
  type CreateLobbyRequest,
  type JoinLobbyRequest,
} from "../models";
import { randomUUID } from "crypto";
import { lobbyService, type LobbyService } from "../services/LobbyService";

function isValidSession(lobby: Lobby, sessionId: string): boolean {
  return lobby.players.some((p) => p.sessionId === sessionId);
}

function toPublicLobby(lobby: Lobby): PublicLobby {
  const mapPlayers = (ps: LobbyPlayer[]): PublicLobbyPlayer[] =>
    ps.map((p) => ({ id: p.id, name: p.name }));
  return {
    id: lobby.id,
    players: mapPlayers(lobby.players),
    ...(lobby.game && {
      game: {
        status: lobby.game.status,
        players: mapPlayers(lobby.game.players),
      },
    }),
  };
}

@Route("lobby")
export class LobbyController extends Controller {
  private lobbyListService: LobbyService;

  constructor(lobbyListService: LobbyService = lobbyService) {
    super();
    this.lobbyListService = lobbyListService;
  }

  /**
   * Create a new lobby. The requesting player becomes the first player and owner.
   * @returns Created lobby plus the owner's session ID
   */
  @Post("create")
  @Response<ServerResponse<LobbyJoinResponse>>(
    200,
    "Lobby created successfully",
  )
  @Response<ServerError>(500, "Server error")
  async createLobby(
    @Body() body: CreateLobbyRequest,
  ): Promise<ServerResponse<LobbyJoinResponse>> {
    const lobbyId = randomUUID();

    if (this.lobbyListService.getLobby(lobbyId)) {
      this.setStatus(500);
      return {
        status: ServerResponseStatus.Error,
        error: "An unknown error occurred",
      };
    }

    const sessionId = randomUUID();
    const owner: LobbyPlayer = {
      id: randomUUID(),
      name: body.playerName,
      sessionId,
    };

    const lobby: Lobby = {
      id: lobbyId,
      ownerSessionId: sessionId,
      players: [owner],
    };

    this.lobbyListService.addLobby(lobby);
    return {
      status: ServerResponseStatus.Success,
      data: { lobby: toPublicLobby(lobby), sessionId },
    };
  }

  /**
   * Get a lobby by ID. Requires a valid x-session-id header.
   * @param lobbyId The lobby ID
   * @returns The lobby (no session IDs exposed)
   */
  @Get("{lobbyId}")
  @Response<ServerResponse<PublicLobby>>(200, "Lobby retrieved successfully")
  @Response<ServerError>(404, "Lobby not found")
  async getLobby(
    @Path() lobbyId: string,
    @Header("x-session-id") sessionId?: string,
  ): Promise<ServerResponse<PublicLobby>> {
    const lobby = lobbyId ? this.lobbyListService.getLobby(lobbyId) : undefined;
    if (!lobby || !sessionId || !isValidSession(lobby, sessionId)) {
      this.setStatus(404);
      return { status: ServerResponseStatus.Error, error: "Lobby not found" };
    }
    return { status: ServerResponseStatus.Success, data: toPublicLobby(lobby) };
  }

  /**
   * Join a lobby
   * @param lobbyId The lobby ID
   * @param body Player name
   * @returns Updated lobby with new player, plus that player's session ID
   */
  @Post("{lobbyId}/join")
  @Response<ServerResponse<LobbyJoinResponse>>(
    201,
    "Player joined successfully",
  )
  @Response<ServerError>(404, "Lobby not found")
  async joinLobby(
    @Path() lobbyId: string,
    @Body() body: JoinLobbyRequest,
  ): Promise<ServerResponse<LobbyJoinResponse>> {
    const lobby = lobbyId ? this.lobbyListService.getLobby(lobbyId) : undefined;
    if (!lobby) {
      this.setStatus(404);
      return { status: ServerResponseStatus.Error, error: "Lobby not found" };
    }

    const sessionId = randomUUID();
    const newPlayer: LobbyPlayer = {
      id: randomUUID(),
      name: body.playerName,
      sessionId,
    };
    lobby.players.push(newPlayer);
    this.setStatus(201);
    return {
      status: ServerResponseStatus.Success,
      data: { lobby: toPublicLobby(lobby), sessionId },
    };
  }
}
