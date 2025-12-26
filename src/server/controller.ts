import type { Request, Response } from "express";
import type { Game, Player } from '../lib/models';
import { ServerResponseStatus, type GameResponse } from './models';
import { randomUUID } from "crypto";

const games: Record<string, Game> = {};

export const createGame = (req: Request, res: Response<GameResponse<Game>>) => {
    const { gameId } = req.params;

    const game = gameId ? games[gameId] : undefined;
    if (!game) {
        res.status(404).json({ status: ServerResponseStatus.ERROR, error: 'Game not found' });
        return;
    }
    res.json({ status: ServerResponseStatus.SUCCESS, data: game });
};

export const getGame = (req: Request, res: Response<GameResponse<Game>>) => {
    const { gameId } = req.params;

    const game = gameId ? games[gameId] : undefined;
    if (!game) {
        res.status(404).json({ status: ServerResponseStatus.ERROR, error: 'Game not found' });
        return;
    }
    res.json({ status: ServerResponseStatus.SUCCESS, data: game });
};


export const joinGame = (req: Request, res: Response<GameResponse<Game>>) => {
    const { gameId } = req.params;
    const game = gameId ? games[gameId] : undefined;
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
}
