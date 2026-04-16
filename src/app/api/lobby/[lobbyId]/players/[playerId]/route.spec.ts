import { describe, it, expect } from "vitest";
import { POST as createLobby } from "../../../create/route";
import { POST as joinLobby } from "../../join/route";
import { PUT as updateConfig } from "../../config/route";
import { POST as startGame } from "@/app/api/[gameMode]/game/create/route";
import { DELETE as removePlayer, PUT as renamePlayer } from "./route";
import {
  postRequest,
  makeLobbyParams as makeParams,
  makePlayerParams,
  makeCreateGameParams,
} from "@/app/api/test-utils";

describe("DELETE /api/lobby/[lobbyId]/players/[playerId]", () => {
  it("should allow a player to remove themselves", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
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
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
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
      new Request(`http://localhost/api/lobby/${lobby.id}/players/${bob.id}`, {
        method: "DELETE",
        headers: { "x-session-id": aliceSession },
      }),
      makePlayerParams(lobby.id, bob.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.players).toHaveLength(1);
  });

  it("should return 403 when a non-owner tries to remove another player", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
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
      new Request(`http://localhost/api/lobby/${lobbyId}/players/${alice.id}`, {
        method: "DELETE",
        headers: { "x-session-id": joinData.sessionId },
      }),
      makePlayerParams(lobbyId, alice.id),
    );
    expect(res.status).toBe(403);
  });

  it("should prevent the owner from leaving the lobby", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
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

describe("PUT /api/lobby/[lobbyId]/players/[playerId]", () => {
  it("should allow a player to rename themselves", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const alice = data.lobby.players[0];

    const res = await renamePlayer(
      new Request(
        `http://localhost/api/lobby/${data.lobby.id}/players/${alice.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": data.sessionId,
          },
          body: JSON.stringify({ playerName: "Alice Renamed" }),
        },
      ),
      makePlayerParams(data.lobby.id, alice.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.players[0].name).toBe("Alice Renamed");
  });

  it("should return 403 when a player tries to rename someone else", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
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

    const res = await renamePlayer(
      new Request(`http://localhost/api/lobby/${lobbyId}/players/${alice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": joinData.sessionId,
        },
        body: JSON.stringify({ playerName: "Alice 2" }),
      }),
      makePlayerParams(lobbyId, alice.id),
    );
    expect(res.status).toBe(403);
  });

  it("should return 400 when the name matches another player", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data: createData } = await createRes.json();
    const lobbyId = createData.lobby.id;
    const alice = createData.lobby.players[0];

    await joinLobby(
      postRequest(`http://localhost/api/lobby/${lobbyId}/join`, {
        playerName: "Bob",
      }),
      makeParams(lobbyId),
    );

    const res = await renamePlayer(
      new Request(`http://localhost/api/lobby/${lobbyId}/players/${alice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": createData.sessionId,
        },
        body: JSON.stringify({ playerName: " Bob " }),
      }),
      makePlayerParams(lobbyId, alice.id),
    );
    expect(res.status).toBe(400);
  });

  it("should return 409 when renaming after game start", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const alice = data.lobby.players[0];

    await joinLobby(
      postRequest(`http://localhost/api/lobby/${data.lobby.id}/join`, {
        playerName: "Bob",
      }),
      makeParams(data.lobby.id),
    );

    await updateConfig(
      new Request(`http://localhost/api/lobby/${data.lobby.id}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": data.sessionId,
        },
        body: JSON.stringify({
          roleBuckets: [
            { playerCount: 1, roles: [{ roleId: "good" }] },
            { playerCount: 1, roles: [{ roleId: "bad" }] },
          ],
        }),
      }),
      makeParams(data.lobby.id),
    );

    await startGame(
      new Request("http://localhost/api/secret-villain/game/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": data.sessionId,
        },
        body: JSON.stringify({ lobbyId: data.lobby.id }),
      }),
      makeCreateGameParams("secret-villain"),
    );

    const res = await renamePlayer(
      new Request(
        `http://localhost/api/lobby/${data.lobby.id}/players/${alice.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": data.sessionId,
          },
          body: JSON.stringify({ playerName: "Alice 2" }),
        },
      ),
      makePlayerParams(data.lobby.id, alice.id),
    );
    expect(res.status).toBe(409);
  });
});
