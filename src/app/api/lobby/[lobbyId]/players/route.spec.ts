import { describe, it, expect } from "vitest";
import { POST as createLobby } from "../../create/route";
import { POST as joinLobby } from "../join/route";
import { POST as startGame } from "@/app/api/[gameMode]/game/create/route";
import { PUT as updateConfig } from "../config/route";
import { POST as createNoDevicePlayer } from "./route";
import {
  postRequest,
  makeLobbyParams as makeParams,
  makeCreateGameParams,
} from "@/app/api/test-utils";

describe("POST /api/lobby/[lobbyId]/players", () => {
  it("returns 401 when no session header is provided", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const lobbyId = data.lobby.id;

    const res = await createNoDevicePlayer(
      new Request(`http://localhost/api/lobby/${lobbyId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: "NoDevice Player" }),
      }),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when the caller is not the lobby owner", async () => {
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

    const res = await createNoDevicePlayer(
      new Request(`http://localhost/api/lobby/${lobbyId}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": joinData.sessionId,
        },
        body: JSON.stringify({ playerName: "NoDevice Player" }),
      }),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when the player name is empty", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();

    const res = await createNoDevicePlayer(
      new Request(`http://localhost/api/lobby/${data.lobby.id}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": data.sessionId,
        },
        body: JSON.stringify({ playerName: "   " }),
      }),
      makeParams(data.lobby.id),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when the player name duplicates an existing player", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();

    const res = await createNoDevicePlayer(
      new Request(`http://localhost/api/lobby/${data.lobby.id}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": data.sessionId,
        },
        body: JSON.stringify({ playerName: "Alice" }),
      }),
      makeParams(data.lobby.id),
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 when a game has already started", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();

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

    const res = await createNoDevicePlayer(
      new Request(`http://localhost/api/lobby/${data.lobby.id}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": data.sessionId,
        },
        body: JSON.stringify({ playerName: "Charlie" }),
      }),
      makeParams(data.lobby.id),
    );
    expect(res.status).toBe(409);
  });

  it("creates a no-device player and returns 201 with the updated lobby", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();

    const res = await createNoDevicePlayer(
      new Request(`http://localhost/api/lobby/${data.lobby.id}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": data.sessionId,
        },
        body: JSON.stringify({ playerName: "Bob (no device)" }),
      }),
      makeParams(data.lobby.id),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("success");

    const players = body.data.lobby.players as { name: string; noDevice?: boolean }[];
    expect(players).toHaveLength(2);
    const noDevicePlayer = players.find((p) => p.name === "Bob (no device)");
    expect(noDevicePlayer).toBeDefined();
    expect(noDevicePlayer?.noDevice).toBe(true);
  });

  it("returns 404 when the lobby does not exist", async () => {
    const res = await createNoDevicePlayer(
      new Request(
        "http://localhost/api/lobby/nonexistent-id/players",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": "any-session-id",
          },
          body: JSON.stringify({ playerName: "Someone" }),
        },
      ),
      makeParams("nonexistent-id"),
    );
    expect(res.status).toBe(404);
  });
});
