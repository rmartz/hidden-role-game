import { describe, it, expect } from "vitest";
import { POST as createLobby } from "../../../lobby/create/route";
import { POST as joinLobby } from "../../../lobby/[lobbyId]/join/route";
import { PUT as updateConfig } from "../../../lobby/[lobbyId]/config/route";
import { POST as startGame } from "./route";
import type { RoleSlot } from "@/lib/types";
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

async function configureRoleSlots(
  lobbyId: string,
  sessionId: string,
  roleSlots: RoleSlot[],
) {
  return updateConfig(
    new Request(`http://localhost/api/lobby/${lobbyId}/config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({ roleSlots }),
    }),
    makeLobbyParams(lobbyId),
  );
}

function makeStartGameRequest(
  gameMode: string,
  sessionId: string,
  lobbyId: string,
) {
  return new Request(`http://localhost/api/${gameMode}/game/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-id": sessionId,
    },
    body: JSON.stringify({ lobbyId }),
  });
}

describe("POST /api/game/create", () => {
  it("should allow the owner to start the game with valid role slots", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers();
    await configureRoleSlots(lobbyId, aliceSession, [
      { roleId: "good", min: 1, max: 1 },
      { roleId: "bad", min: 1, max: 1 },
    ]);

    const res = await startGame(
      makeStartGameRequest("secret-villain", aliceSession, lobbyId),
      makeCreateGameParams("secret-villain"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.gameId).toBeDefined();
  });

  it("should return 400 when role slot count does not match player count", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers();
    await configureRoleSlots(lobbyId, aliceSession, [
      { roleId: "good", min: 1, max: 1 },
    ]);

    const res = await startGame(
      makeStartGameRequest("secret-villain", aliceSession, lobbyId),
      makeCreateGameParams("secret-villain"),
    );
    expect(res.status).toBe(400);
  });

  it("should return 403 when a non-owner tries to start the game", async () => {
    const { lobbyId, bobSession } = await setupLobbyWithPlayers();

    const res = await startGame(
      makeStartGameRequest("secret-villain", bobSession, lobbyId),
      makeCreateGameParams("secret-villain"),
    );
    expect(res.status).toBe(403);
  });

  it("should allow starting an Avalon game with Avalon role slots", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers("avalon");
    await configureRoleSlots(lobbyId, aliceSession, [
      { roleId: "avalon-merlin", min: 1, max: 1 },
      { roleId: "avalon-minion", min: 1, max: 1 },
    ]);

    const res = await startGame(
      makeStartGameRequest("avalon", aliceSession, lobbyId),
      makeCreateGameParams("avalon"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.gameId).toBeDefined();
  });

  it("should return 400 when using a role from the wrong game mode", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers("avalon");
    await configureRoleSlots(lobbyId, aliceSession, [
      { roleId: "good", min: 1, max: 1 },
      { roleId: "bad", min: 1, max: 1 },
    ]);

    const res = await startGame(
      makeStartGameRequest("avalon", aliceSession, lobbyId),
      makeCreateGameParams("avalon"),
    );
    expect(res.status).toBe(400);
  });

  it("should return 400 for an unknown game mode", async () => {
    const res = await startGame(
      new Request("http://localhost/api/not-a-real-mode/game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lobbyId: "any" }),
      }),
      makeCreateGameParams("not-a-real-mode"),
    );
    expect(res.status).toBe(400);
  });

  it("should return 409 when the game mode does not match the lobby", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers();

    const res = await startGame(
      makeStartGameRequest("avalon", aliceSession, lobbyId),
      makeCreateGameParams("avalon"),
    );
    expect(res.status).toBe(409);
  });

  it("should return 409 when the game has already started", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers();
    await configureRoleSlots(lobbyId, aliceSession, [
      { roleId: "good", min: 1, max: 1 },
      { roleId: "bad", min: 1, max: 1 },
    ]);

    await startGame(
      makeStartGameRequest("secret-villain", aliceSession, lobbyId),
      makeCreateGameParams("secret-villain"),
    );

    const res = await startGame(
      makeStartGameRequest("secret-villain", aliceSession, lobbyId),
      makeCreateGameParams("secret-villain"),
    );
    expect(res.status).toBe(409);
  });

  it("should allow starting a Werewolf game with Werewolf role slots", async () => {
    const { lobbyId, aliceSession } = await setupLobbyWithPlayers("werewolf");
    // Alice (owner) is the Narrator; Bob gets the only role slot.
    await configureRoleSlots(lobbyId, aliceSession, [
      { roleId: "werewolf-villager", min: 1, max: 1 },
    ]);

    const res = await startGame(
      makeStartGameRequest("werewolf", aliceSession, lobbyId),
      makeCreateGameParams("werewolf"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.gameId).toBeDefined();
  });
});
