import type { Express } from "express";
import express, { Router } from 'express';
import { GameController } from "./controllers/GameController";
import { GameListService } from "./services/GameListService";

const app: Express = express();
const port = 3000;
export const router = Router()

const gameListService = new GameListService();
const gameController = new GameController(gameListService);

app.use(express.json());
app.use(gameController.router);

app.listen(port, () => {
    console.log(`Secret Villain Game server listening on port ${port}`);
});
