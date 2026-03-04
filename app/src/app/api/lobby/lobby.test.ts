import { describe, it, expect } from "vitest";
import { POST as createLobby } from "./create/route";
import { GET as getLobby } from "./[lobbyId]/route";
import { POST as joinLobby } from "./[lobbyId]/join/route";

function makeParams(lobbyId: string) {
  return { params: Promise.resolve({ lobbyId }) };
}

function postRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Lobby API", () => {
  it("should create a lobby with a player name and return sessionId", async () => {
    const res = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.id).toBeTruthy();
    expect(body.data.sessionId).toBeTruthy();
    expect(body.data.lobby.players).toHaveLength(1);
    expect(body.data.lobby.players[0].name).toBe("Alice");
    expect(body.data.lobby.players[0].sessionId).toBeUndefined();
  });

  it("should return 404 for getLobby with no session header", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const lobbyId = data.lobby.id;

    const res = await getLobby(
      new Request(`http://localhost/api/lobby/${lobbyId}`),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(404);
  });

  it("should return 404 for getLobby with wrong session header", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const lobbyId = data.lobby.id;

    const res = await getLobby(
      new Request(`http://localhost/api/lobby/${lobbyId}`, {
        headers: { "x-session-id": "not-a-real-session-id" },
      }),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(404);
  });

  it("should get a lobby by id with valid session", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const { lobby, sessionId } = data;

    const res = await getLobby(
      new Request(`http://localhost/api/lobby/${lobby.id}`, {
        headers: { "x-session-id": sessionId },
      }),
      makeParams(lobby.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.id).toBe(lobby.id);
    expect(Array.isArray(body.data.players)).toBe(true);
  });

  it("should return 404 when getting a lobby that does not exist", async () => {
    const res = await getLobby(
      new Request("http://localhost/api/lobby/nonexistent-id", {
        headers: { "x-session-id": "any-session-id" },
      }),
      makeParams("nonexistent-id"),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.error).toBe("Lobby not found");
  });

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
