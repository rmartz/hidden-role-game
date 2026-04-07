import { describe, it, expect } from "vitest";
import { POST as createLobby } from "../../create/route";
import { POST as joinLobby } from "../join/route";
import { PUT as reorderPlayers } from "./route";
import {
  postRequest,
  makeLobbyParams as makeParams,
} from "@/app/api/test-utils";
import type { PublicLobby } from "@/server/types";

function putRequest(url: string, sessionId: string, body: unknown): Request {
  return new Request(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-session-id": sessionId,
    },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/lobby/[lobbyId]/order", () => {
  it("allows any lobby member to reorder players", async () => {
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
    const { data: joinData } = (await joinRes.json()) as {
      data: { lobby: PublicLobby; sessionId: string };
    };
    const alice = lobby.players[0];
    const bob = joinData.lobby.players.find((p) => p.id !== alice.id);
    if (!bob) throw new Error("Bob not found in lobby");

    const res = await reorderPlayers(
      putRequest(`http://localhost/api/lobby/${lobby.id}/order`, aliceSession, {
        playerOrder: [bob.id, alice.id],
      }),
      makeParams(lobby.id),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.playerOrder).toEqual([bob.id, alice.id]);
  });

  it("allows a non-owner member to reorder players", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data: createData } = await createRes.json();
    const { lobby } = createData;

    const joinRes = await joinLobby(
      postRequest(`http://localhost/api/lobby/${lobby.id}/join`, {
        playerName: "Bob",
      }),
      makeParams(lobby.id),
    );
    const { data: joinData } = (await joinRes.json()) as {
      data: { lobby: PublicLobby; sessionId: string };
    };
    const alice = lobby.players[0];
    const bob = joinData.lobby.players.find((p) => p.id !== alice.id);
    if (!bob) throw new Error("Bob not found in lobby");

    const res = await reorderPlayers(
      putRequest(
        `http://localhost/api/lobby/${lobby.id}/order`,
        joinData.sessionId,
        { playerOrder: [bob.id, alice.id] },
      ),
      makeParams(lobby.id),
    );

    expect(res.status).toBe(200);
  });

  it("returns 400 when playerOrder is missing a lobby player", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data: createData } = await createRes.json();
    const { lobby, sessionId: aliceSession } = createData;

    await joinLobby(
      postRequest(`http://localhost/api/lobby/${lobby.id}/join`, {
        playerName: "Bob",
      }),
      makeParams(lobby.id),
    );

    const res = await reorderPlayers(
      putRequest(`http://localhost/api/lobby/${lobby.id}/order`, aliceSession, {
        playerOrder: [lobby.players[0].id],
      }),
      makeParams(lobby.id),
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when playerOrder contains unknown IDs", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data: createData } = await createRes.json();
    const { lobby, sessionId: aliceSession } = createData;

    const res = await reorderPlayers(
      putRequest(`http://localhost/api/lobby/${lobby.id}/order`, aliceSession, {
        playerOrder: ["unknown-id"],
      }),
      makeParams(lobby.id),
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 when playerOrder is not an array", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data: createData } = await createRes.json();
    const { lobby, sessionId: aliceSession } = createData;

    const res = await reorderPlayers(
      putRequest(`http://localhost/api/lobby/${lobby.id}/order`, aliceSession, {
        playerOrder: "invalid",
      }),
      makeParams(lobby.id),
    );

    expect(res.status).toBe(400);
  });

  it("returns 401 when no session is provided", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data: createData } = await createRes.json();
    const { lobby } = createData;

    const res = await reorderPlayers(
      new Request(`http://localhost/api/lobby/${lobby.id}/order`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerOrder: [lobby.players[0].id] }),
      }),
      makeParams(lobby.id),
    );

    expect(res.status).toBe(401);
  });

  it("returns 404 for a nonexistent lobby", async () => {
    const res = await reorderPlayers(
      putRequest(
        "http://localhost/api/lobby/nonexistent/order",
        "any-session",
        {
          playerOrder: [],
        },
      ),
      makeParams("nonexistent"),
    );

    expect(res.status).toBe(404);
  });
});
