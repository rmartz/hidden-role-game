import type { Express } from "express";
import { LobbyController } from "../controllers/LobbyController";
import type { GameListService } from "../services/GameListService";

export function setupTestRoutes(
  app: Express,
  gameListService: GameListService,
) {
  const lobbyController = new LobbyController(gameListService);

  // Manually setup the routes for testing
  app.post("/game/create", async (req, res, next) => {
    try {
      const result = await lobbyController.createGame();
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/game/:gameId", async (req, res, next) => {
    try {
      const result = await lobbyController.getGame(req.params.gameId);
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
      const result = await lobbyController.joinGame(
        req.params.gameId,
        req.body,
      );
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
