import { describe, it, expect } from "vitest";
import { POST as createLobby } from "../../lobby/create/route";
import { POST as joinLobby } from "../../lobby/[lobbyId]/join/route";
import { POST as startGame } from "./route";
import { postRequest, makeLobbyParams } from "@/app/api/test-utils";

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

describe("POST /api/game/create", () => {
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
          gameMode: "secret-villain",
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
          gameMode: "secret-villain",
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
          gameMode: "secret-villain",
          roleSlots: [
            { roleId: "good", count: 1 },
            { roleId: "bad", count: 1 },
          ],
        }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("should allow starting an Avalon game with Avalon role slots", async () => {
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
          gameMode: "avalon",
          roleSlots: [
            { roleId: "avalon-good", count: 1 },
            { roleId: "avalon-bad", count: 1 },
          ],
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.gameId).toBeDefined();
  });

  it("should return 400 when using a role from the wrong game mode", async () => {
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
          gameMode: "avalon",
          roleSlots: [
            { roleId: "good", count: 1 },
            { roleId: "bad", count: 1 },
          ],
        }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("should return 400 for an unknown game mode", async () => {
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
          gameMode: "not-a-real-mode",
          roleSlots: [
            { roleId: "good", count: 1 },
            { roleId: "bad", count: 1 },
          ],
        }),
      }),
    );
    expect(res.status).toBe(400);
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
        body: JSON.stringify({
          lobbyId,
          gameMode: "secret-villain",
          roleSlots: slots,
        }),
      }),
    );

    const res = await startGame(
      new Request("http://localhost/api/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({
          lobbyId,
          gameMode: "secret-villain",
          roleSlots: slots,
        }),
      }),
    );
    expect(res.status).toBe(409);
  });

  it("should allow starting a Werewolf game with Werewolf role slots", async () => {
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
          gameMode: "werewolf",
          roleSlots: [
            { roleId: "werewolf-good", count: 1 },
            { roleId: "werewolf-bad", count: 1 },
          ],
        }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.gameId).toBeDefined();
  });
});
