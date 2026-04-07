import { describe, it, expect } from "vitest";
import { POST as returnToLobby } from "./route";
import { POST as createLobby } from "../../create/route";
import { POST as joinLobby } from "../join/route";
import { PUT as updateConfig } from "../config/route";
import { POST as startGame } from "@/app/api/[gameMode]/game/create/route";
import { updateGameStatus } from "@/services/game";
import { GameStatus } from "@/lib/types";
import {
  postRequest,
  makeLobbyParams as makeParams,
  makeCreateGameParams,
} from "@/app/api/test-utils";

async function setupFinishedGame() {
  const createRes = await createLobby(
    postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
  );
  const { data: createData } = (await createRes.json()) as {
    data: { lobby: { id: string }; sessionId: string };
  };
  const { lobby, sessionId: aliceSession } = createData;
  const lobbyId = lobby.id;

  const joinRes = await joinLobby(
    postRequest(`http://localhost/api/lobby/${lobbyId}/join`, {
      playerName: "Bob",
    }),
    makeParams(lobbyId),
  );
  const { data: joinData } = (await joinRes.json()) as {
    data: { sessionId: string };
  };
  const bobSession = joinData.sessionId;

  await updateConfig(
    new Request(`http://localhost/api/lobby/${lobbyId}/config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": aliceSession,
      },
      body: JSON.stringify({
        roleSlots: [
          { roleId: "good", min: 1, max: 1 },
          { roleId: "bad", min: 1, max: 1 },
        ],
      }),
    }),
    makeParams(lobbyId),
  );

  const startRes = await startGame(
    new Request("http://localhost/api/secret-villain/game/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": aliceSession,
      },
      body: JSON.stringify({ lobbyId }),
    }),
    makeCreateGameParams("secret-villain"),
  );
  const { data: startData } = (await startRes.json()) as {
    data: { lobby: { gameId: string } };
  };
  const gameId = startData.lobby.gameId;

  await updateGameStatus(gameId, { type: GameStatus.Finished });

  return { lobbyId, gameId, aliceSession, bobSession };
}

describe("POST /api/lobby/[lobbyId]/return", () => {
  it("should return 401 with no session header", async () => {
    const { lobbyId } = await setupFinishedGame();

    const res = await returnToLobby(
      new Request(`http://localhost/api/lobby/${lobbyId}/return`, {
        method: "POST",
      }),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(401);
  });

  it("should return 403 with wrong session header", async () => {
    const { lobbyId } = await setupFinishedGame();

    const res = await returnToLobby(
      new Request(`http://localhost/api/lobby/${lobbyId}/return`, {
        method: "POST",
        headers: { "x-session-id": "not-a-real-session-id" },
      }),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(403);
  });

  it("should return 404 for a non-existent lobby", async () => {
    const res = await returnToLobby(
      new Request("http://localhost/api/lobby/nonexistent-id/return", {
        method: "POST",
        headers: { "x-session-id": "any-session-id" },
      }),
      makeParams("nonexistent-id"),
    );
    expect(res.status).toBe(404);
  });

  it("should return 409 when the game is still in progress", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data: createData } = (await createRes.json()) as {
      data: { lobby: { id: string }; sessionId: string };
    };
    const { lobby, sessionId: aliceSession } = createData;
    const lobbyId = lobby.id;

    await joinLobby(
      postRequest(`http://localhost/api/lobby/${lobbyId}/join`, {
        playerName: "Bob",
      }),
      makeParams(lobbyId),
    );

    await updateConfig(
      new Request(`http://localhost/api/lobby/${lobbyId}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({
          roleSlots: [
            { roleId: "good", min: 1, max: 1 },
            { roleId: "bad", min: 1, max: 1 },
          ],
        }),
      }),
      makeParams(lobbyId),
    );

    await startGame(
      new Request("http://localhost/api/secret-villain/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({ lobbyId }),
      }),
      makeCreateGameParams("secret-villain"),
    );

    const res = await returnToLobby(
      new Request(`http://localhost/api/lobby/${lobbyId}/return`, {
        method: "POST",
        headers: { "x-session-id": aliceSession },
      }),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("Game is still in progress");
  });

  it("should allow a player to return to lobby after a finished game", async () => {
    const { lobbyId, aliceSession } = await setupFinishedGame();

    const res = await returnToLobby(
      new Request(`http://localhost/api/lobby/${lobbyId}/return`, {
        method: "POST",
        headers: { "x-session-id": aliceSession },
      }),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.gameId).toBeUndefined();
  });

  it("should succeed for a second player after the first already returned to lobby", async () => {
    const { lobbyId, aliceSession, bobSession } = await setupFinishedGame();

    const firstRes = await returnToLobby(
      new Request(`http://localhost/api/lobby/${lobbyId}/return`, {
        method: "POST",
        headers: { "x-session-id": aliceSession },
      }),
      makeParams(lobbyId),
    );
    expect(firstRes.status).toBe(200);

    const secondRes = await returnToLobby(
      new Request(`http://localhost/api/lobby/${lobbyId}/return`, {
        method: "POST",
        headers: { "x-session-id": bobSession },
      }),
      makeParams(lobbyId),
    );
    expect(secondRes.status).toBe(200);
    const body = await secondRes.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.gameId).toBeUndefined();
  });
});
