import type { Express, Request, Response } from "express";
import express from 'express';
import type { Game, Player } from '../lib/models';
import { ServerResponseStatus, type GameResponse } from './models';
import { randomUUID } from "crypto";

const app: Express = express();
const port = 3000;

const games: Record<string, Game> = {};

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

app.put('/creategame', (req: Request, res: Response<GameResponse<Game>>) => {
    const newGame: Game = {
        id: randomUUID(),
        players: []
    };
    games[newGame.id] = newGame;
    res.status(201).json({ status: ServerResponseStatus.SUCCESS, data: newGame });
});

app.put('/game/join', (req: Request, res: Response<GameResponse<Game>>) => {
    const { gameId, playerName } = req.body;
    const game = games[gameId];
    if (!game) {
        res.status(404).json({ status: ServerResponseStatus.ERROR, error: 'Game not found' });
        return;
    }
    const newPlayer: Player = {
        id: randomUUID(),
        name: playerName
    };
    game.players.push(newPlayer);
    res.status(201).json({ status: ServerResponseStatus.SUCCESS, data: game });
});

app.listen(port, () => {
    console.log(`Secret Villain Game server listening on port ${port}`);
});
