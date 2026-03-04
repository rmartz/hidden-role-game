import type { Express } from "express";
import cors from "cors";
import express from "express";
import { RegisterRoutes } from "./routes";
import { LobbyController } from "./controllers/LobbyController";
import { lobbyService } from "./services/LobbyService";

const app: Express = express();
const port = 7001;
const uiOrigin = process.env["UI_ORIGIN"] ?? "http://localhost:3000";

// Middleware
app.use(
  cors({
    origin: uiOrigin,
  }),
);
app.use(express.json());

// Register tsoa-generated routes
RegisterRoutes(app);

app.listen(port, () => {
  console.log(`Secret Villain Game server listening on port ${port}`);
});

export { LobbyController, lobbyService };
