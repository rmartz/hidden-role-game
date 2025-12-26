import { Router } from "express";
import { createGame, getGame, joinGame } from "./controller";

export const router = Router()

router.get('/game/:gameId', getGame);
router.post('/game/create', createGame);
router.post('/game/:gameId/join', joinGame);
