import type { Request, Response } from "express";
import type { Game, Player } from '../../lib/models';
import { ServerResponseStatus, type GameResponse } from '../models';
import { randomUUID } from "crypto";
import type { GameListService } from "../services/GameListService";
import { BaseController } from "./BaseController";

export const GameControllerPaths = {
    createGame: '/game/create',
    getGame: '/game/:gameId',
    joinGame: '/game/:gameId/join'
}

export class GameController extends BaseController {
    private gameListService: GameListService;

    constructor(gameListService: GameListService) {
        super();
        this.gameListService = gameListService;

        this.router.post(GameControllerPaths.createGame, (req: Request, res: Response<GameResponse<Game>>) => {
            const gameId = randomUUID();

            if (this.gameListService.getGame(gameId)) {
                res.status(500).json({ status: ServerResponseStatus.ERROR, error: 'An unknown error occurred' });
                return;
            }

            const game: Game = {
                id: gameId,
                players: []
            };
            this.gameListService.addGame(game);
            res.json({ status: ServerResponseStatus.SUCCESS, data: game });
        });

        this.router.get(GameControllerPaths.getGame, (req: Request, res: Response<GameResponse<Game>>) => {
            const { gameId } = req.params;

            const game = gameId ? this.gameListService.getGame(gameId) : undefined;
            if (!game) {
                res.status(404).json({ status: ServerResponseStatus.ERROR, error: 'Game not found' });
                return;
            }
            res.json({ status: ServerResponseStatus.SUCCESS, data: game });
        });


        this.router.post(GameControllerPaths.joinGame, (req: Request, res: Response<GameResponse<Game>>) => {
            const { gameId } = req.params;
            const game = gameId ? this.gameListService.getGame(gameId) : undefined;
            if (!game) {
                res.status(404).json({ status: ServerResponseStatus.ERROR, error: 'Game not found' });
                return;
            }

            const newPlayer: Player = {
                id: randomUUID(),
                name: req.body.playerName
            };
            game.players.push(newPlayer);
            res.status(201).json({ status: ServerResponseStatus.SUCCESS, data: game });
        });
    }
}
