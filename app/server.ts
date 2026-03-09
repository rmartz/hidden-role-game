import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws";
import { lobbySocketManager } from "./src/server/lobby-socket-manager";
import { lobbyService } from "./src/services/LobbyService";
import { toPublicLobby } from "./src/server/lobby-helpers";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  const server = createServer((req, res) => {
    void handle(req, res, parse(req.url ?? "", true));
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url ?? "", true);
    if (pathname !== "/api/ws") {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws, req) => {
    const { query } = parse(req.url ?? "", true);
    const lobbyId = Array.isArray(query.lobbyId)
      ? query.lobbyId[0]
      : query.lobbyId;
    const sessionId = Array.isArray(query.sessionId)
      ? query.sessionId[0]
      : query.sessionId;

    if (!lobbyId || !sessionId) {
      ws.close(4000, "Missing lobbyId or sessionId");
      return;
    }

    const lobby = lobbyService.getLobby(lobbyId);
    if (!lobby?.players.some((p) => p.sessionId === sessionId)) {
      ws.close(4001, "Unauthorized");
      return;
    }

    lobbySocketManager.subscribe(lobbyId, sessionId, ws);

    // Send the current lobby state immediately on connect.
    ws.send(
      JSON.stringify({
        type: "lobby_updated",
        lobby: toPublicLobby(lobby, sessionId),
      }),
    );

    ws.on("close", () => {
      lobbySocketManager.unsubscribe(lobbyId, ws);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${String(port)}`);
  });
});
