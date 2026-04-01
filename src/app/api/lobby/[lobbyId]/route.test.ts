import { describe, it, expect } from "vitest";
import { POST as createLobby } from "../create/route";
import { GET as getLobby } from "./route";
import {
  postRequest,
  makeLobbyParams as makeParams,
} from "@/app/api/test-utils";

describe("GET /api/lobby/[lobbyId]", () => {
  it("should return 401 with no session header", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const lobbyId = data.lobby.id;

    const res = await getLobby(
      new Request(`http://localhost/api/lobby/${lobbyId}`),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(401);
  });

  it("should return 403 with wrong session header", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const lobbyId = data.lobby.id;

    const res = await getLobby(
      new Request(`http://localhost/api/lobby/${lobbyId}`, {
        headers: { "x-session-id": "not-a-real-session-id" },
      }),
      makeParams(lobbyId),
    );
    expect(res.status).toBe(403);
  });

  it("should return the lobby with a valid session", async () => {
    const createRes = await createLobby(
      postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
    );
    const { data } = await createRes.json();
    const { lobby, sessionId } = data;

    const res = await getLobby(
      new Request(`http://localhost/api/lobby/${lobby.id}`, {
        headers: { "x-session-id": sessionId },
      }),
      makeParams(lobby.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.id).toBe(lobby.id);
    expect(Array.isArray(body.data.players)).toBe(true);
  });

  it("should return 404 when the lobby does not exist", async () => {
    const res = await getLobby(
      new Request("http://localhost/api/lobby/nonexistent-id", {
        headers: { "x-session-id": "any-session-id" },
      }),
      makeParams("nonexistent-id"),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.error).toBe("Lobby not found");
  });
});
