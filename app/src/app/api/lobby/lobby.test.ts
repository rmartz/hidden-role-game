import { describe, it, expect } from "vitest";
import { POST as createLobby } from "./create/route";
import { GET as getLobby } from "./[lobbyId]/route";
import { POST as joinLobby } from "./[lobbyId]/join/route";
import { DELETE as removePlayer } from "./[lobbyId]/players/[playerId]/route";

function makeParams(lobbyId: string) {
  return { params: Promise.resolve({ lobbyId }) };
}

function makePlayerParams(lobbyId: string, playerId: string) {
  return { params: Promise.resolve({ lobbyId, playerId }) };
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
    expect(body.data.playerId).toBeTruthy();
    expect(body.data.lobby.players).toHaveLength(1);
    expect(body.data.lobby.players[0].name).toBe("Alice");
    expect(body.data.lobby.players[0].sessionId).toBeUndefined();
    expect(body.data.lobby.ownerPlayerId).toBe(body.data.lobby.players[0].id);
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

  describe("remove player", () => {
    it("should allow a player to remove themselves", async () => {
      const createRes = await createLobby(
        postRequest("http://localhost/api/lobby/create", {
          playerName: "Alice",
        }),
      );
      const { data: createData } = await createRes.json();
      const lobbyId = createData.lobby.id;

      const joinRes = await joinLobby(
        postRequest(`http://localhost/api/lobby/${lobbyId}/join`, {
          playerName: "Bob",
        }),
        makeParams(lobbyId),
      );
      const { data: joinData } = await joinRes.json();
      const bob = joinData.lobby.players[1];

      const res = await removePlayer(
        new Request(`http://localhost/api/lobby/${lobbyId}/players/${bob.id}`, {
          method: "DELETE",
          headers: { "x-session-id": joinData.sessionId },
        }),
        makePlayerParams(lobbyId, bob.id),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.lobby.players).toHaveLength(1);
      expect(body.data.lobby.players[0].name).toBe("Alice");
    });

    it("should allow the owner to remove another player", async () => {
      const createRes = await createLobby(
        postRequest("http://localhost/api/lobby/create", {
          playerName: "Alice",
        }),
      );
      const { data: createData } = await createRes.json();
      const { lobby, sessionId: aliceSession } = createData;

      const joinRes = await joinLobby(
        postRequest(`http://localhost/api/lobby/${lobby.id}/join`, {
          playerName: "Bob",
        }),
        makeParams(lobby.id),
      );
      const { data: joinData } = await joinRes.json();
      const bob = joinData.lobby.players[1];

      const res = await removePlayer(
        new Request(
          `http://localhost/api/lobby/${lobby.id}/players/${bob.id}`,
          {
            method: "DELETE",
            headers: { "x-session-id": aliceSession },
          },
        ),
        makePlayerParams(lobby.id, bob.id),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.lobby.players).toHaveLength(1);
    });

    it("should return 403 when a non-owner tries to remove another player", async () => {
      const createRes = await createLobby(
        postRequest("http://localhost/api/lobby/create", {
          playerName: "Alice",
        }),
      );
      const { data: createData } = await createRes.json();
      const lobbyId = createData.lobby.id;
      const alice = createData.lobby.players[0];

      const joinRes = await joinLobby(
        postRequest(`http://localhost/api/lobby/${lobbyId}/join`, {
          playerName: "Bob",
        }),
        makeParams(lobbyId),
      );
      const { data: joinData } = await joinRes.json();

      const res = await removePlayer(
        new Request(
          `http://localhost/api/lobby/${lobbyId}/players/${alice.id}`,
          {
            method: "DELETE",
            headers: { "x-session-id": joinData.sessionId },
          },
        ),
        makePlayerParams(lobbyId, alice.id),
      );
      expect(res.status).toBe(403);
    });

    it("should return null lobby when last player leaves", async () => {
      const createRes = await createLobby(
        postRequest("http://localhost/api/lobby/create", {
          playerName: "Alice",
        }),
      );
      const { data } = await createRes.json();
      const alice = data.lobby.players[0];

      const res = await removePlayer(
        new Request(
          `http://localhost/api/lobby/${data.lobby.id}/players/${alice.id}`,
          {
            method: "DELETE",
            headers: { "x-session-id": data.sessionId },
          },
        ),
        makePlayerParams(data.lobby.id, alice.id),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.lobby).toBeNull();
    });

    it("should transfer ownership when the owner leaves", async () => {
      const createRes = await createLobby(
        postRequest("http://localhost/api/lobby/create", {
          playerName: "Alice",
        }),
      );
      const { data: createData } = await createRes.json();
      const { lobby, sessionId: aliceSession } = createData;
      const alice = lobby.players[0];

      await joinLobby(
        postRequest(`http://localhost/api/lobby/${lobby.id}/join`, {
          playerName: "Bob",
        }),
        makeParams(lobby.id),
      );

      const res = await removePlayer(
        new Request(
          `http://localhost/api/lobby/${lobby.id}/players/${alice.id}`,
          {
            method: "DELETE",
            headers: { "x-session-id": aliceSession },
          },
        ),
        makePlayerParams(lobby.id, alice.id),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.lobby.players).toHaveLength(1);
      expect(body.data.lobby.players[0].name).toBe("Bob");
      expect(body.data.lobby.ownerPlayerId).toBe(body.data.lobby.players[0].id);
    });

    it("should return 404 when removing a player from a nonexistent lobby", async () => {
      const res = await removePlayer(
        new Request(
          "http://localhost/api/lobby/nonexistent-id/players/some-player-id",
          {
            method: "DELETE",
            headers: { "x-session-id": "any-session-id" },
          },
        ),
        makePlayerParams("nonexistent-id", "some-player-id"),
      );
      expect(res.status).toBe(404);
    });
  });
});
