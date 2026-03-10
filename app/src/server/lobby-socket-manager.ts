import { WebSocket } from "ws";
import type { Lobby } from "../lib/models";
import { toPublicLobby } from "@/server/utils";
import type { LobbySocketEvent } from "./models/websocket";

class LobbySocketManager {
  private connections = new Map<string, Map<WebSocket, string>>();

  subscribe(lobbyId: string, sessionId: string, ws: WebSocket): void {
    let subs = this.connections.get(lobbyId);
    if (!subs) {
      subs = new Map();
      this.connections.set(lobbyId, subs);
    }
    subs.set(ws, sessionId);
  }

  unsubscribe(lobbyId: string, ws: WebSocket): void {
    this.connections.get(lobbyId)?.delete(ws);
  }

  broadcast(
    lobbyId: string,
    lobby: Lobby,
    reason: LobbySocketEvent["reason"],
  ): void {
    const subs = this.connections.get(lobbyId);
    if (!subs) return;
    subs.forEach((sessionId, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        const event: LobbySocketEvent = {
          type: "lobby_updated",
          reason,
          lobby: toPublicLobby(lobby, sessionId),
        };
        ws.send(JSON.stringify(event));
      }
    });
  }
}

declare global {
  var lobbySocketManagerInstance: LobbySocketManager | undefined;
}

export const lobbySocketManager: LobbySocketManager =
  globalThis.lobbySocketManagerInstance ??
  (globalThis.lobbySocketManagerInstance = new LobbySocketManager());
