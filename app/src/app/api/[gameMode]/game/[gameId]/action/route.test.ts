import { describe, it, expect } from "vitest";
import { POST as createLobby } from "../../../../lobby/create/route";
import { POST as joinLobby } from "../../../../lobby/[lobbyId]/join/route";
import { POST as startGame } from "../../create/route";
import { POST as doAction } from "./route";
import {
  postRequest,
  makeLobbyParams,
  makeGameParams,
  makeCreateGameParams,
} from "@/app/api/test-utils";

async function setupStartedGame() {
  const createRes = await createLobby(
    postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
  );
  const { data: createData } = await createRes.json();
  const { lobby, sessionId: aliceSession } = createData;

  await joinLobby(
    postRequest(`http://localhost/api/lobby/${lobby.id}/join`, {
      playerName: "Bob",
    }),
    makeLobbyParams(lobby.id),
  );

  const startRes = await startGame(
    new Request("http://localhost/api/secret-villain/game/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": aliceSession,
      },
      body: JSON.stringify({
        lobbyId: lobby.id,
        roleSlots: [
          { roleId: "good", min: 1, max: 1 },
          { roleId: "bad", min: 1, max: 1 },
        ],
      }),
    }),
    makeCreateGameParams("secret-villain"),
  );
  const { data: startData } = await startRes.json();

  return {
    gameId: startData.lobby.gameId as string,
    aliceSession: aliceSession as string,
  };
}

describe("POST /api/[gameMode]/game/[gameId]/action", () => {
  it("should return 400 for an unknown game mode", async () => {
    const res = await doAction(
      new Request(
        "http://localhost/api/not-a-mode/game/nonexistent-id/action",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionId: "any" }),
        },
      ),
      makeGameParams("nonexistent-id", "not-a-mode"),
    );
    expect(res.status).toBe(400);
  });

  it("should return 401 with no session header", async () => {
    const res = await doAction(
      new Request(
        "http://localhost/api/secret-villain/game/nonexistent-id/action",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionId: "any" }),
        },
      ),
      makeGameParams("nonexistent-id", "secret-villain"),
    );
    expect(res.status).toBe(401);
  });

  it("should return 409 when game mode param does not match the game", async () => {
    const { gameId, aliceSession } = await setupStartedGame();

    const res = await doAction(
      new Request(`http://localhost/api/avalon/game/${gameId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({ actionId: "any" }),
      }),
      makeGameParams(gameId, "avalon"),
    );
    expect(res.status).toBe(409);
  });
});
