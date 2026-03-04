import { Controller, Post, Get, Route, Response, Body, Path } from "tsoa";
import type { Lobby, LobbyPlayer } from "../../lib/models";
import {
  ServerResponseStatus,
  type ServerError,
  type ServerResponse,
} from "../models";
import { randomUUID } from "crypto";
import type { LobbyService } from "../services/LobbyService";

interface JoinLobbyRequest {
  playerName: string;
}

@Route("lobby")
export class LobbyController extends Controller {
  private lobbyListService: LobbyService;

  constructor(lobbyListService: LobbyService) {
    super();
    this.lobbyListService = lobbyListService;
  }

  /**
   * Create a new lobby
   * @returns Created lobby
   */
  @Post("create")
  @Response<ServerResponse<Lobby>>(200, "Lobby created successfully")
  @Response<ServerError>(500, "Server error")
  async createLobby(): Promise<ServerResponse<Lobby>> {
    const lobbyId = randomUUID();

    if (this.lobbyListService.getLobby(lobbyId)) {
      this.setStatus(500);
      return {
        status: ServerResponseStatus.Error,
        error: "An unknown error occurred",
      };
    }

    const lobby: Lobby = {
      id: lobbyId,
      players: [],
    };
    this.lobbyListService.addLobby(lobby);
    return { status: ServerResponseStatus.Success, data: lobby };
  }

  /**
   * Get a lobby by ID
   * @param lobbyId The lobby ID
   * @returns The lobby
   */
  @Get("{lobbyId}")
  @Response<ServerResponse<Lobby>>(200, "Lobby retrieved successfully")
  @Response<ServerError>(404, "Lobby not found")
  async getLobby(@Path() lobbyId: string): Promise<ServerResponse<Lobby>> {
    const lobby = lobbyId ? this.lobbyListService.getLobby(lobbyId) : undefined;
    if (!lobby) {
      this.setStatus(404);
      return { status: ServerResponseStatus.Error, error: "Lobby not found" };
    }
    return { status: ServerResponseStatus.Success, data: lobby };
  }

  /**
   * Join a lobby
   * @param lobbyId The lobby ID
   * @param body Player name
   * @returns Updated lobby with new player
   */
  @Post("{lobbyId}/join")
  @Response<ServerResponse<Lobby>>(201, "Player joined successfully")
  @Response<ServerError>(404, "Lobby not found")
  async joinLobby(
    @Path() lobbyId: string,
    @Body() body: JoinLobbyRequest,
  ): Promise<ServerResponse<Lobby>> {
    const lobby = lobbyId ? this.lobbyListService.getLobby(lobbyId) : undefined;
    if (!lobby) {
      this.setStatus(404);
      return { status: ServerResponseStatus.Error, error: "Lobby not found" };
    }

    const newPlayer: LobbyPlayer = {
      id: randomUUID(),
      name: body.playerName,
    };
    lobby.players.push(newPlayer);
    this.setStatus(201);
    return { status: ServerResponseStatus.Success, data: lobby };
  }
}
