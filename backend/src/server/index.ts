import type { Express } from "express";
import express from "express";
import { RegisterRoutes } from "./routes";
import { GameController } from "./controllers/GameController";
import { GameListService } from "./services/GameListService";

const app: Express = express();
const port = 3000;

// Dependency injection
const gameListService = new GameListService();

// Middleware
app.use(express.json());

// Register tsoa-generated routes
RegisterRoutes(app);

app.listen(port, () => {
  console.log(`Secret Villain Game server listening on port ${port}`);
});

export { GameController, gameListService };
