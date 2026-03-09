import { describe, it, expect } from "vitest";
import { POST as createLobby } from "../../lobby/create/route";
import { POST as joinLobby } from "../../lobby/[lobbyId]/join/route";
import { POST as startGame } from "../create/route";
import { GET as getGameState } from "./route";
import {
  postRequest,
  makeLobbyParams,
  makeGameParams,
} from "@/app/api/test-utils";

async function setupStartedGame() {
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

  const startRes = await startGame(
    new Request("http://localhost/api/game/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": aliceSession,
      },
      body: JSON.stringify({
        lobbyId: lobby.id,
        gameMode: "secret-villain",
        roleSlots: [
          { roleId: "good", count: 1 },
          { roleId: "bad", count: 1 },
        ],
      }),
    }),
  );
  const { data: startData } = await startRes.json();

  return {
    gameId: startData.lobby.gameId as string,
    aliceSession: aliceSession as string,
    bobSession: joinData.sessionId as string,
  };
}

describe("GET /api/game/[gameId]", () => {
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
    expect(Array.isArray(body.data.visibleRoleAssignments)).toBe(true);
  });

  it("should return 401 with no session header", async () => {
    const res = await getGameState(
      new Request("http://localhost/api/game/nonexistent-id"),
      makeGameParams("nonexistent-id"),
    );
    expect(res.status).toBe(401);
  });

  it("should return 403 when the game does not exist", async () => {
    const res = await getGameState(
      new Request("http://localhost/api/game/nonexistent-id", {
        headers: { "x-session-id": "any-session-id" },
      }),
      makeGameParams("nonexistent-id"),
    );
    expect(res.status).toBe(403);
  });

  it("should return 403 with wrong session header for a valid game", async () => {
    const { gameId } = await setupStartedGame();

    const res = await getGameState(
      new Request(`http://localhost/api/game/${gameId}`, {
        headers: { "x-session-id": "not-a-real-session-id" },
      }),
      makeGameParams(gameId),
    );
    expect(res.status).toBe(403);
  });

  it("should show Secret Villain bad role player their bad teammates", async () => {
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

    // Bad role can see Bad team players; with only 1 bad player there are none to see
    const badPlayer =
      aliceBody.data.myRole.id === "bad" ? aliceBody.data : bobBody.data;
    const goodPlayer =
      aliceBody.data.myRole.id === "good" ? aliceBody.data : bobBody.data;

    expect(badPlayer.visibleRoleAssignments).toHaveLength(0); // no other bad players
    expect(goodPlayer.visibleRoleAssignments).toHaveLength(0); // good cannot see anyone
  });

  it("should show Avalon special good role player all bad role players", async () => {
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
    const bobSession = joinData.sessionId as string;

    const startRes = await startGame(
      new Request("http://localhost/api/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({
          lobbyId: lobby.id,
          gameMode: "avalon",
          roleSlots: [
            { roleId: "avalon-special-good", count: 1 },
            { roleId: "avalon-bad", count: 1 },
          ],
        }),
      }),
    );
    const { data: startData } = await startRes.json();
    const gameId = startData.lobby.gameId as string;

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

    const specialGoodPlayer =
      aliceBody.data.myRole.id === "avalon-special-good"
        ? aliceBody.data
        : bobBody.data;
    const badPlayer =
      aliceBody.data.myRole.id === "avalon-bad" ? aliceBody.data : bobBody.data;

    expect(specialGoodPlayer.visibleRoleAssignments).toHaveLength(1);
    expect(specialGoodPlayer.visibleRoleAssignments[0].role.id).toBe(
      "avalon-bad",
    );
    expect(badPlayer.visibleRoleAssignments).toHaveLength(0);
  });
});
