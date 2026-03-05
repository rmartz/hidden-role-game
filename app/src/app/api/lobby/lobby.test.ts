import { describe, it, expect } from "vitest";
import { POST as createLobby } from "./create/route";
import { GET as getLobby } from "./[lobbyId]/route";
import { POST as joinLobby } from "./[lobbyId]/join/route";
import { DELETE as removePlayer } from "./[lobbyId]/players/[playerId]/route";
import { PUT as transferOwner } from "./[lobbyId]/owner/route";
import { POST as startGame } from "../game/create/route";
import { GET as getGameState } from "../game/[gameId]/route";

function makeParams(lobbyId: string) {
  return { params: Promise.resolve({ lobbyId }) };
}

function makePlayerParams(lobbyId: string, playerId: string) {
  return { params: Promise.resolve({ lobbyId, playerId }) };
}

function makeGameParams(gameId: string) {
  return { params: Promise.resolve({ gameId }) };
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

  describe("transfer owner", () => {
    it("should allow the owner to transfer ownership to another player", async () => {
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

      const res = await transferOwner(
        new Request(`http://localhost/api/lobby/${lobby.id}/owner`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": aliceSession,
          },
          body: JSON.stringify({ playerId: bob.id }),
        }),
        makeParams(lobby.id),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.lobby.ownerPlayerId).toBe(bob.id);
    });

    it("should return 403 when a non-owner tries to transfer ownership", async () => {
      const createRes = await createLobby(
        postRequest("http://localhost/api/lobby/create", {
          playerName: "Alice",
        }),
      );
      const { data: createData } = await createRes.json();
      const { lobby } = createData;

      const joinRes = await joinLobby(
        postRequest(`http://localhost/api/lobby/${lobby.id}/join`, {
          playerName: "Bob",
        }),
        makeParams(lobby.id),
      );
      const { data: joinData } = await joinRes.json();
      const alice = lobby.players[0];

      const res = await transferOwner(
        new Request(`http://localhost/api/lobby/${lobby.id}/owner`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": joinData.sessionId,
          },
          body: JSON.stringify({ playerId: alice.id }),
        }),
        makeParams(lobby.id),
      );
      expect(res.status).toBe(403);
    });

    it("should return 404 when transferring ownership in a nonexistent lobby", async () => {
      const res = await transferOwner(
        new Request("http://localhost/api/lobby/nonexistent-id/owner", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": "any-session-id",
          },
          body: JSON.stringify({ playerId: "some-player-id" }),
        }),
        makeParams("nonexistent-id"),
      );
      expect(res.status).toBe(404);
    });
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

    it("should prevent the owner from leaving the lobby", async () => {
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
      expect(res.status).toBe(403);
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

  describe("start game", () => {
    async function setupLobbyWithPlayers() {
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

      return {
        lobbyId: lobby.id as string,
        aliceSession: aliceSession as string,
        bobSession: joinData.sessionId as string,
      };
    }

    it("should allow the owner to start the game with valid role slots", async () => {
      const { lobbyId, aliceSession } = await setupLobbyWithPlayers();

      const res = await startGame(
        new Request("http://localhost/api/game/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": aliceSession,
          },
          body: JSON.stringify({
            lobbyId,
            roleSlots: [
              { roleId: "good", count: 1 },
              { roleId: "bad", count: 1 },
            ],
          }),
        }),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.lobby.gameId).toBeDefined();
    });

    it("should return 400 when role slot count does not match player count", async () => {
      const { lobbyId, aliceSession } = await setupLobbyWithPlayers();

      const res = await startGame(
        new Request("http://localhost/api/game/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": aliceSession,
          },
          body: JSON.stringify({
            lobbyId,
            roleSlots: [{ roleId: "good", count: 1 }],
          }),
        }),
      );
      expect(res.status).toBe(400);
    });

    it("should return 403 when a non-owner tries to start the game", async () => {
      const { lobbyId, bobSession } = await setupLobbyWithPlayers();

      const res = await startGame(
        new Request("http://localhost/api/game/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": bobSession,
          },
          body: JSON.stringify({
            lobbyId,
            roleSlots: [
              { roleId: "good", count: 1 },
              { roleId: "bad", count: 1 },
            ],
          }),
        }),
      );
      expect(res.status).toBe(403);
    });

    it("should return 409 when the game has already started", async () => {
      const { lobbyId, aliceSession } = await setupLobbyWithPlayers();
      const slots = [
        { roleId: "good", count: 1 },
        { roleId: "bad", count: 1 },
      ];

      await startGame(
        new Request("http://localhost/api/game/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": aliceSession,
          },
          body: JSON.stringify({ lobbyId, roleSlots: slots }),
        }),
      );

      const res = await startGame(
        new Request("http://localhost/api/game/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": aliceSession,
          },
          body: JSON.stringify({ lobbyId, roleSlots: slots }),
        }),
      );
      expect(res.status).toBe(409);
    });
  });

  describe("game state", () => {
    async function setupStartedGame() {
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

      const startRes = await startGame(
        new Request("http://localhost/api/game/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": aliceSession,
          },
          body: JSON.stringify({
            lobbyId: lobby.id,
            roleSlots: [
              { roleId: "good", count: 1 },
              { roleId: "bad", count: 1 },
            ],
          }),
        }),
      );
      const { data: startData } = await startRes.json();

      return {
        lobbyId: lobby.id as string,
        gameId: startData.lobby.gameId as string,
        aliceSession: aliceSession as string,
        bobSession: joinData.sessionId as string,
      };
    }

    it("should return the player game state for a valid session", async () => {
      const { gameId, aliceSession } = await setupStartedGame();

      const res = await getGameState(
        new Request(`http://localhost/api/game/${gameId}`, {
          headers: { "x-session-id": aliceSession },
        }),
        makeGameParams(gameId),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("success");
      expect(body.data.myRole).toBeDefined();
      expect(body.data.myRole.id).toMatch(/good|bad|special-bad/);
      expect(body.data.players).toHaveLength(2);
      expect(Array.isArray(body.data.visibleTeammates)).toBe(true);
    });

    it("should return 404 when the game does not exist", async () => {
      const res = await getGameState(
        new Request("http://localhost/api/game/nonexistent-id", {
          headers: { "x-session-id": "any-session-id" },
        }),
        makeGameParams("nonexistent-id"),
      );
      expect(res.status).toBe(404);
    });

    it("should show bad role player their teammates", async () => {
      const { gameId, aliceSession, bobSession } = await setupStartedGame();

      const aliceRes = await getGameState(
        new Request(`http://localhost/api/game/${gameId}`, {
          headers: { "x-session-id": aliceSession },
        }),
        makeGameParams(gameId),
      );
      const aliceBody = await aliceRes.json();

      const bobRes = await getGameState(
        new Request(`http://localhost/api/game/${gameId}`, {
          headers: { "x-session-id": bobSession },
        }),
        makeGameParams(gameId),
      );
      const bobBody = await bobRes.json();

      // The player with "bad" role should see their teammates (who are knownToTeammates)
      // The player with "good" role should see nobody
      const badPlayer =
        aliceBody.data.myRole.id === "bad" ? aliceBody.data : bobBody.data;
      const goodPlayer =
        aliceBody.data.myRole.id === "good" ? aliceBody.data : bobBody.data;

      expect(badPlayer.visibleTeammates).toHaveLength(0); // bad has no other bad players
      expect(goodPlayer.visibleTeammates).toHaveLength(0); // good cannot see anyone
    });
  });
});
