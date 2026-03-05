import { describe, it, expect } from "vitest";
import { POST as createLobby } from "../lobby/create/route";
import { POST as joinLobby } from "../lobby/[lobbyId]/join/route";
import { POST as startGame } from "./create/route";
import { GET as getGameState } from "./[gameId]/route";

function makeLobbyParams(lobbyId: string) {
  return { params: Promise.resolve({ lobbyId }) };
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

async function setupLobbyWithPlayers() {
  const createRes = await createLobby(
    postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
  );
  const { data: createData } = await createRes.json();
  const { lobby, sessionId: aliceSession } = createData;

  const joinRes = await joinLobby(
    postRequest(`http://localhost/api/lobby/${lobby.id}/join`, {
      playerName: "Bob",
    }),
    makeLobbyParams(lobby.id),
  );
  const { data: joinData } = await joinRes.json();

  return {
    lobbyId: lobby.id as string,
    aliceSession: aliceSession as string,
    bobSession: joinData.sessionId as string,
  };
}

async function setupStartedGame() {
  const { lobbyId, aliceSession, bobSession } = await setupLobbyWithPlayers();

  const startRes = await startGame(
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
  const { data: startData } = await startRes.json();

  return {
    lobbyId,
    gameId: startData.lobby.gameId as string,
    aliceSession,
    bobSession,
  };
}

describe("Game API", () => {
  describe("create game", () => {
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
