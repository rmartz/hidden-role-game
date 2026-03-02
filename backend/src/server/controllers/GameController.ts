import { Controller, Post, Get, Route, Response, Body, Path } from "tsoa";
import type { Game, Player } from "../../lib/models";
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
   * Create a new game
   * @returns Created game object
   */
  @Post("create")
  @Response<GameResponse<Game>>(200, "Game created successfully")
  @Response<ServerError>(500, "Server error")
  async createGame(): Promise<GameResponse<Game>> {
    const gameId = randomUUID();

    if (this.gameListService.getGame(gameId)) {
      this.setStatus(500);
      return {
        status: ServerResponseStatus.ERROR,
        error: "An unknown error occurred",
      };
    }

    const game: Game = {
      id: gameId,
      players: [],
    };
    this.gameListService.addGame(game);
    return { status: ServerResponseStatus.SUCCESS, data: game };
  }

  /**
   * Get a game by ID
   * @param gameId The game ID
   * @returns The game object
   */
  @Get("{gameId}")
  @Response<GameResponse<Game>>(200, "Game retrieved successfully")
  @Response<ServerError>(404, "Game not found")
  async getGame(@Path() gameId: string): Promise<GameResponse<Game>> {
    const game = gameId ? this.gameListService.getGame(gameId) : undefined;
    if (!game) {
      this.setStatus(404);
      return { status: ServerResponseStatus.ERROR, error: "Game not found" };
    }
    return { status: ServerResponseStatus.SUCCESS, data: game };
  }

  /**
   * Join a game
   * @param gameId The game ID
   * @param body Player name
   * @returns Updated game object with new player
   */
  @Post("{gameId}/join")
  @Response<GameResponse<Game>>(201, "Player joined successfully")
  @Response<ServerError>(404, "Game not found")
  async joinGame(
    @Path() gameId: string,
    @Body() body: JoinGameRequest,
  ): Promise<GameResponse<Game>> {
    const game = gameId ? this.gameListService.getGame(gameId) : undefined;
    if (!game) {
      this.setStatus(404);
      return { status: ServerResponseStatus.ERROR, error: "Game not found" };
    }

    const newPlayer: Player = {
      id: randomUUID(),
      name: body.playerName,
    };
    game.players.push(newPlayer);
    this.setStatus(201);
    return { status: ServerResponseStatus.SUCCESS, data: game };
  }
}
