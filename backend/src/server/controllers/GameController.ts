import { Controller, Post, Get, Route, Response, Body, Path } from "tsoa";
import type { Lobby, LobbyPlayer } from "../../lib/models";
import {
  ServerResponseStatus,
  type GameResponse,
  type ServerError,
} from "../models";
import { randomUUID } from "crypto";
import type { GameListService } from "../services/GameListService";

interface JoinGameRequest {
  playerName: string;
}

@Route("game")
export class GameController extends Controller {
  private gameListService: GameListService;

  constructor(gameListService: GameListService) {
    super();
    this.gameListService = gameListService;
  }

  /**
   * Create a new lobby
   * @returns Created lobby object
   */
  @Post("create")
  @Response<GameResponse<Lobby>>(200, "Lobby created successfully")
  @Response<ServerError>(500, "Server error")
  async createGame(): Promise<GameResponse<Lobby>> {
    const lobbyId = randomUUID();

    if (this.gameListService.getLobby(lobbyId)) {
      this.setStatus(500);
      return {
        status: ServerResponseStatus.ERROR,
        error: "An unknown error occurred",
      };
    }

    const lobby: Lobby = {
      id: lobbyId,
      players: [],
    };
    this.gameListService.addLobby(lobby);
    return { status: ServerResponseStatus.SUCCESS, data: lobby };
  }

  /**
   * Get a lobby by ID
   * @param gameId The lobby ID
   * @returns The lobby object
   */
  @Get("{gameId}")
  @Response<GameResponse<Lobby>>(200, "Lobby retrieved successfully")
  @Response<ServerError>(404, "Game not found")
  async getGame(@Path() gameId: string): Promise<GameResponse<Lobby>> {
    const lobby = gameId ? this.gameListService.getLobby(gameId) : undefined;
    if (!lobby) {
      this.setStatus(404);
      return { status: ServerResponseStatus.ERROR, error: "Game not found" };
    }
    return { status: ServerResponseStatus.SUCCESS, data: lobby };
  }

  /**
   * Join a lobby
   * @param gameId The lobby ID
   * @param body Player name
   * @returns Updated lobby object with new player
   */
  @Post("{gameId}/join")
  @Response<GameResponse<Lobby>>(201, "Player joined successfully")
  @Response<ServerError>(404, "Game not found")
  async joinGame(
    @Path() gameId: string,
    @Body() body: JoinGameRequest,
  ): Promise<GameResponse<Lobby>> {
    const lobby = gameId ? this.gameListService.getLobby(gameId) : undefined;
    if (!lobby) {
      this.setStatus(404);
      return { status: ServerResponseStatus.ERROR, error: "Game not found" };
    }

    const newPlayer: LobbyPlayer = {
      id: randomUUID(),
      name: body.playerName,
    };
    lobby.players.push(newPlayer);
    this.setStatus(201);
    return { status: ServerResponseStatus.SUCCESS, data: lobby };
  }
}
