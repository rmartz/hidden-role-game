import type * as Party from "partykit/server";
import type { LobbySocketEvent } from "../src/server/types/websocket";

/**
 * PartyKit room server for lobby real-time notifications.
 *
 * Each lobby gets its own room (room ID = lobbyId). Next.js API routes POST
 * to this server whenever lobby state changes; the server broadcasts a
 * lightweight notification to all connected clients. Clients then re-fetch
 * the full lobby state from Next.js directly.
 *
 * This design keeps sensitive data (session IDs, full lobby state) off the
 * PartyKit server and ensures authorization is always enforced by Next.js.
 */
export default class LobbyParty implements Party.Server {
  constructor(readonly party: Party.Room) {}

  /**
   * Called by Next.js API routes to trigger a broadcast.
   * Protected by a shared secret set in PARTYKIT_SECRET env var.
   */
  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const secret = this.party.env["PARTYKIT_SECRET"] as string | undefined;
    if (secret) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader !== `Bearer ${secret}`) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const body: { reason: string } = await req.json();
    const event: LobbySocketEvent = {
      type: "lobby_updated",
      reason: body.reason as LobbySocketEvent["reason"],
    };
    this.party.broadcast(JSON.stringify(event));

    return new Response("OK");
  }
}

LobbyParty satisfies Party.Worker;
