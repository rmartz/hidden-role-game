import { describe, it, expect } from "vitest";
import { POST as createLobby } from "./route";
import { postRequest } from "@/app/api/test-utils";
import { ShowRolesInPlay } from "@/lib/types";

describe("POST /api/lobby/create", () => {
  it("should reject an empty player name", async () => {
    const res = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
  });

  it("should reject a player name exceeding 32 characters", async () => {
    const res = await createLobby(
      postRequest("http://localhost/api/lobby/create", {
        playerName: "A".repeat(33),
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
  });

  it("should reject a player name with HTML or JSON characters", async () => {
    const res = await createLobby(
      postRequest("http://localhost/api/lobby/create", {
        playerName: "<script>",
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
  });

  it("should accept a player name at the 32 character limit", async () => {
    const res = await createLobby(
      postRequest("http://localhost/api/lobby/create", {
        playerName: "A".repeat(32),
      }),
    );
    expect(res.status).toBe(200);
  });

  it("should normalize internal whitespace in the creator's name", async () => {
    const res = await createLobby(
      postRequest("http://localhost/api/lobby/create", {
        playerName: "Alice\tSmith",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.lobby.players[0].name).toBe("Alice Smith");
  });

  it("should return 400 for an invalid game mode", async () => {
    const res = await createLobby(
      postRequest("http://localhost/api/lobby/create", {
        playerName: "Alice",
        gameMode: "not-a-real-mode",
      }),
    );
    expect(res.status).toBe(400);
  });

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
    expect(body.data.lobby.config.showRolesInPlay).toBe(
      ShowRolesInPlay.ConfiguredOnly,
    );
  });
});
