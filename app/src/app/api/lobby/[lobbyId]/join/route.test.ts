import { describe, it, expect } from "vitest";
import { POST as createLobby } from "../../create/route";
import { POST as joinLobby } from "./route";
import {
  postRequest,
  makeLobbyParams as makeParams,
} from "@/app/api/test-utils";

describe("POST /api/lobby/[lobbyId]/join", () => {
  it("should allow a player to join a lobby and return sessionId", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const lobbyId = data.lobby.id;

    const joinRes = await joinLobby(
      postRequest(`http://localhost/api/lobby/${lobbyId}/join`, {
        playerName: "Bob",
      }),
      makeParams(lobbyId),
    );
    expect(joinRes.status).toBe(201);
    const body = await joinRes.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.id).toBe(lobbyId);
    expect(body.data.sessionId).toBeTruthy();
    expect(body.data.playerId).toBeTruthy();
    expect(body.data.lobby.players).toHaveLength(2);
    const bob = body.data.lobby.players[1];
    expect(bob.name).toBe("Bob");
    expect(bob.id).toBeTruthy();
    expect(bob.sessionId).toBeUndefined();
  });

  it("should allow multiple players to join a lobby", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const lobbyId = data.lobby.id;

    await joinLobby(
      postRequest(`http://localhost/api/lobby/${lobbyId}/join`, {
        playerName: "Bob",
      }),
      makeParams(lobbyId),
    );

    const join2Res = await joinLobby(
      postRequest(`http://localhost/api/lobby/${lobbyId}/join`, {
        playerName: "Carol",
      }),
      makeParams(lobbyId),
    );
    const body = await join2Res.json();
    expect(body.data.lobby.players).toHaveLength(3);
    expect(body.data.lobby.players[2].name).toBe("Carol");
  });

  it("should reject an empty player name", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const lobbyId = data.lobby.id;

    const res = await joinLobby(
      postRequest(`http://localhost/api/lobby/${lobbyId}/join`, {
        playerName: "",
      }),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
  });

  it("should reject a player name exceeding 32 characters", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const lobbyId = data.lobby.id;

    const res = await joinLobby(
      postRequest(`http://localhost/api/lobby/${lobbyId}/join`, {
        playerName: "A".repeat(33),
      }),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
  });

  it("should reject a player name with HTML or JSON characters", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const lobbyId = data.lobby.id;

    const res = await joinLobby(
      postRequest(`http://localhost/api/lobby/${lobbyId}/join`, {
        playerName: "<script>",
      }),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
  });

  it("should reject joining a full lobby", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const lobbyId = data.lobby.id;

    for (let i = 1; i < 100; i++) {
      await joinLobby(
        postRequest(`http://localhost/api/lobby/${lobbyId}/join`, {
          playerName: `Player${String(i)}`,
        }),
        makeParams(lobbyId),
      );
    }

    const res = await joinLobby(
      postRequest(`http://localhost/api/lobby/${lobbyId}/join`, {
        playerName: "Overflow",
      }),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.error).toBe("Lobby is full");
  });

  it("should return 404 when joining a lobby that does not exist", async () => {
    const res = await joinLobby(
      postRequest("http://localhost/api/lobby/nonexistent-id/join", {
        playerName: "Alice",
      }),
      makeParams("nonexistent-id"),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.error).toBe("Lobby not found");
  });
});
