import type { Express } from "express";
import { LobbyController } from "../controllers/LobbyController";
import type { LobbyService } from "../services/LobbyService";

export function setupTestRoutes(app: Express, lobbyListService: LobbyService) {
  const lobbyController = new LobbyController(lobbyListService);

  app.post("/lobby/create", async (req, res, next) => {
    try {
      const result = await lobbyController.createGame();
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/lobby/:lobbyId", async (req, res, next) => {
    try {
      const result = await lobbyController.getGame(req.params.lobbyId);
      if (result.status === "error") {
        res.status(404).json(result);
      } else {
        res.json(result);
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/lobby/:lobbyId/join", async (req, res, next) => {
    try {
      const result = await lobbyController.joinGame(
        req.params.lobbyId,
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
