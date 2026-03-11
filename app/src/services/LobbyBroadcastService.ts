import type { LobbySocketEvent } from "@/server/types/websocket";

const PARTYKIT_HOST =
  process.env["NEXT_PUBLIC_PARTYKIT_HOST"] ?? "localhost:1999";

function getPartyUrl(lobbyId: string): string {
  const protocol = PARTYKIT_HOST.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${PARTYKIT_HOST}/parties/lobby/${lobbyId}`;
}

class LobbyBroadcastService {
  broadcast(lobbyId: string, reason: LobbySocketEvent["reason"]): void {
    const url = getPartyUrl(lobbyId);
    const secret = process.env["PARTYKIT_SECRET"];

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (secret) headers["Authorization"] = `Bearer ${secret}`;

    void fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ reason }),
    }).catch((err: unknown) => {
      console.error(
        `[LobbyBroadcastService] Failed to notify party room ${lobbyId}:`,
        err,
      );
    });
  }
}

declare global {
  var lobbyBroadcastServiceInstance: LobbyBroadcastService | undefined;
}

export const lobbyBroadcastService: LobbyBroadcastService =
  globalThis.lobbyBroadcastServiceInstance ??
  (globalThis.lobbyBroadcastServiceInstance = new LobbyBroadcastService());
