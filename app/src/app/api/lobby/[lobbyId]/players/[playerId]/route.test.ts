import { describe, it, expect } from "vitest";
import { POST as createLobby } from "../../../create/route";
import { POST as joinLobby } from "../../join/route";
import { DELETE as removePlayer } from "./route";
import {
  postRequest,
  makeLobbyParams as makeParams,
  makePlayerParams,
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
