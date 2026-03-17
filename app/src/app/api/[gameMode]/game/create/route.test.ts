import { describe, it, expect } from "vitest";
import { POST as createLobby } from "../../../lobby/create/route";
import { POST as joinLobby } from "../../../lobby/[lobbyId]/join/route";
import { POST as startGame } from "./route";
import {
  postRequest,
  makeLobbyParams,
  makeCreateGameParams,
} from "@/app/api/test-utils";

async function setupLobbyWithPlayers(gameMode?: string) {
  const createRes = await createLobby(
    postRequest("http://localhost/api/lobby/create", {
      playerName: "Alice",
      ...(gameMode ? { gameMode } : {}),
    }),
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

describe("POST /api/game/create", () => {
  it("should allow the owner to start the game with valid role slots", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers();

    const res = await startGame(
      new Request("http://localhost/api/secret-villain/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({
          lobbyId,
          roleSlots: [
            { roleId: "good", min: 1, max: 1 },
            { roleId: "bad", min: 1, max: 1 },
          ],
        }),
      }),
      makeCreateGameParams("secret-villain"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.gameId).toBeDefined();
  });

  it("should return 400 when role slot count does not match player count", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers();

    const res = await startGame(
      new Request("http://localhost/api/secret-villain/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({
          lobbyId,
          roleSlots: [{ roleId: "good", min: 1, max: 1 }],
        }),
      }),
      makeCreateGameParams("secret-villain"),
    );
    expect(res.status).toBe(400);
  });

  it("should return 403 when a non-owner tries to start the game", async () => {
    const { lobbyId, bobSession } = await setupLobbyWithPlayers();

    const res = await startGame(
      new Request("http://localhost/api/secret-villain/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": bobSession,
        },
        body: JSON.stringify({
          lobbyId,
          roleSlots: [
            { roleId: "good", min: 1, max: 1 },
            { roleId: "bad", min: 1, max: 1 },
          ],
        }),
      }),
      makeCreateGameParams("secret-villain"),
    );
    expect(res.status).toBe(403);
  });

  it("should allow starting an Avalon game with Avalon role slots", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers("avalon");

    const res = await startGame(
      new Request("http://localhost/api/avalon/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({
          lobbyId,
          roleSlots: [
            { roleId: "avalon-good", min: 1, max: 1 },
            { roleId: "avalon-bad", min: 1, max: 1 },
          ],
        }),
      }),
      makeCreateGameParams("avalon"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.gameId).toBeDefined();
  });

  it("should return 400 when using a role from the wrong game mode", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers("avalon");

    const res = await startGame(
      new Request("http://localhost/api/avalon/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({
          lobbyId,
          roleSlots: [
            { roleId: "good", min: 1, max: 1 },
            { roleId: "bad", min: 1, max: 1 },
          ],
        }),
      }),
      makeCreateGameParams("avalon"),
    );
    expect(res.status).toBe(400);
  });

  it("should return 400 for an unknown game mode", async () => {
    const res = await startGame(
      new Request("http://localhost/api/not-a-real-mode/game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyId: "any", roleSlots: [] }),
      }),
      makeCreateGameParams("not-a-real-mode"),
    );
    expect(res.status).toBe(400);
  });

  it("should return 409 when the game mode does not match the lobby", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers();

    const res = await startGame(
      new Request("http://localhost/api/avalon/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({
          lobbyId,
          roleSlots: [
            { roleId: "avalon-good", min: 1, max: 1 },
            { roleId: "avalon-bad", min: 1, max: 1 },
          ],
        }),
      }),
      makeCreateGameParams("avalon"),
    );
    expect(res.status).toBe(409);
  });

  it("should return 409 when the game has already started", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers();
    const slots = [
      { roleId: "good", min: 1, max: 1 },
      { roleId: "bad", min: 1, max: 1 },
    ];

    await startGame(
      new Request("http://localhost/api/secret-villain/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({ lobbyId, roleSlots: slots }),
      }),
      makeCreateGameParams("secret-villain"),
    );

    const res = await startGame(
      new Request("http://localhost/api/secret-villain/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({ lobbyId, roleSlots: slots }),
      }),
      makeCreateGameParams("secret-villain"),
    );
    expect(res.status).toBe(409);
  });

  it("should allow starting a Werewolf game with Werewolf role slots", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers("werewolf");

    const res = await startGame(
      new Request("http://localhost/api/werewolf/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({
          lobbyId,
          // Alice (owner) is the Narrator; Bob gets the only role slot.
          roleSlots: [{ roleId: "werewolf-villager", min: 1, max: 1 }],
        }),
      }),
      makeCreateGameParams("werewolf"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.gameId).toBeDefined();
  });
});
