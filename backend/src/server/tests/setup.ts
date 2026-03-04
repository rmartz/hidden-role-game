import type { Express } from "express";
import { GameController } from "../controllers/GameController";
import type { GameListService } from "../services/GameListService";

export function setupTestRoutes(
  app: Express,
  gameListService: GameListService,
) {
  const gameController = new GameController(gameListService);

  // Manually setup the routes for testing
  app.post("/game/create", async (req, res, next) => {
    try {
      const result = await gameController.createGame();
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/game/:gameId", async (req, res, next) => {
    try {
      const sessionId = req.query.sessionId as string | undefined;
      const result = await gameController.getGame(req.params.gameId, sessionId);
      if (result.status === "error") {
        res.status(404).json(result);
      } else {
        res.json(result);
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/game/:gameId/join", async (req, res, next) => {
    try {
      const result = await gameController.joinGame(req.params.gameId, req.body);
      if (result.status === "error") {
        res.status(404).json(result);
      } else {
        res.status(201).json(result);
      }
    } catch (error) {
      next(error);
    }
  });
}
