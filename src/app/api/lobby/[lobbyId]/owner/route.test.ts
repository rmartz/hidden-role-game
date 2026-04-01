import { describe, it, expect } from "vitest";
import { POST as createLobby } from "../../create/route";
import { POST as joinLobby } from "../join/route";
import { PUT as transferOwner } from "./route";
import {
  postRequest,
  makeLobbyParams as makeParams,
} from "@/app/api/test-utils";

describe("PUT /api/lobby/[lobbyId]/owner", () => {
  it("should allow the owner to transfer ownership to another player", async () => {
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

    const res = await transferOwner(
      new Request(`http://localhost/api/lobby/${lobby.id}/owner`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({ playerId: bob.id }),
      }),
      makeParams(lobby.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.lobby.ownerPlayerId).toBe(bob.id);
  });

  it("should return 403 when a non-owner tries to transfer ownership", async () => {
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
    const { data: joinData } = await joinRes.json();
    const alice = lobby.players[0];

    const res = await transferOwner(
      new Request(`http://localhost/api/lobby/${lobby.id}/owner`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": joinData.sessionId,
        },
        body: JSON.stringify({ playerId: alice.id }),
      }),
      makeParams(lobby.id),
    );
    expect(res.status).toBe(403);
  });

  it("should return 404 when transferring ownership in a nonexistent lobby", async () => {
    const res = await transferOwner(
      new Request("http://localhost/api/lobby/nonexistent-id/owner", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": "any-session-id",
        },
        body: JSON.stringify({ playerId: "some-player-id" }),
      }),
      makeParams("nonexistent-id"),
    );
    expect(res.status).toBe(404);
  });
});
