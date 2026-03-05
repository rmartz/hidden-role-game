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
