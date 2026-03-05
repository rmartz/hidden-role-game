import { describe, it, expect } from "vitest";
import { POST as createLobby } from "./route";
import { postRequest } from "@/app/api/test-utils";

describe("POST /api/lobby/create", () => {
  it("should create a lobby with a player name and return sessionId", async () => {
    const res = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.id).toBeTruthy();
    expect(body.data.sessionId).toBeTruthy();
    expect(body.data.playerId).toBeTruthy();
    expect(body.data.lobby.players).toHaveLength(1);
    expect(body.data.lobby.players[0].name).toBe("Alice");
    expect(body.data.lobby.players[0].sessionId).toBeUndefined();
    expect(body.data.lobby.ownerPlayerId).toBe(body.data.lobby.players[0].id);
  });
});
