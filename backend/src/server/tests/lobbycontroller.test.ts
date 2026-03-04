import express from "express";
import { describe, it } from "node:test";
import assert from "node:assert";
import { LobbyService } from "../services/LobbyService.js";
import { setupTestRoutes } from "./setup.js";
import request from "supertest";

const api = express();

api.use(express.urlencoded({ extended: true }));
api.use(express.json());

const lobbyService = new LobbyService();
setupTestRoutes(api, lobbyService);

describe("LobbyController", () => {
  it("should create a lobby with a player name and return sessionId", async () => {
    const response = await request(api)
      .post("/lobby/create")
      .send({ playerName: "Alice" })
      .expect("Content-Type", /json/)
      .expect(200);

    assert.equal(response.body.status, "success");
    assert(response.body.data.lobby.id, "Lobby should have an id");
    assert(response.body.data.sessionId, "Response should include sessionId");
    assert.equal(
      response.body.data.lobby.players.length,
      1,
      "New lobby should have the creator as a player",
    );
    assert.equal(response.body.data.lobby.players[0].name, "Alice");
    assert(
      !response.body.data.lobby.players[0].sessionId,
      "Player in lobby response must not expose sessionId",
    );
  });

  it("should return 404 for getLobby with no session header", async () => {
    const createResponse = await request(api)
      .post("/lobby/create")
      .send({ playerName: "Alice" })
      .expect(200);
    const lobbyId = createResponse.body.data.lobby.id;

    await request(api).get(`/lobby/${lobbyId}`).expect(404);
  });

  it("should return 404 for getLobby with wrong session header", async () => {
    const createResponse = await request(api)
      .post("/lobby/create")
      .send({ playerName: "Alice" })
      .expect(200);
    const lobbyId = createResponse.body.data.lobby.id;

    await request(api)
      .get(`/lobby/${lobbyId}`)
      .set("x-session-id", "not-a-real-session-id")
      .expect(404);
  });

  it("should get a lobby by id with valid session", async () => {
    const createResponse = await request(api)
      .post("/lobby/create")
      .send({ playerName: "Alice" })
      .expect(200);
    const lobbyId = createResponse.body.data.lobby.id;
    const sessionId = createResponse.body.data.sessionId;

    const getResponse = await request(api)
      .get(`/lobby/${lobbyId}`)
      .set("x-session-id", sessionId)
      .expect("Content-Type", /json/)
      .expect(200);

    assert.equal(getResponse.body.status, "success");
    assert.equal(getResponse.body.data.id, lobbyId);
    assert(Array.isArray(getResponse.body.data.players));
  });

  it("should return 404 when getting a lobby that does not exist", async () => {
    const response = await request(api)
      .get("/lobby/nonexistent-game-id")
      .set("x-session-id", "any-session-id")
      .expect("Content-Type", /json/)
      .expect(404);

    assert.equal(response.body.status, "error");
    assert.equal(response.body.error, "Lobby not found");
  });

  it("should allow a player to join a lobby and return sessionId", async () => {
    const createResponse = await request(api)
      .post("/lobby/create")
      .send({ playerName: "Alice" })
      .expect(200);
    const lobbyId = createResponse.body.data.lobby.id;

    const joinResponse = await request(api)
      .post(`/lobby/${lobbyId}/join`)
      .send({ playerName: "Bob" })
      .expect("Content-Type", /json/)
      .expect(201);

    assert.equal(joinResponse.body.status, "success");
    assert.equal(joinResponse.body.data.lobby.id, lobbyId);
    assert(
      joinResponse.body.data.sessionId,
      "Join response should include sessionId",
    );
    assert.equal(joinResponse.body.data.lobby.players.length, 2);

    const bob = joinResponse.body.data.lobby.players[1];
    assert.equal(bob.name, "Bob");
    assert(bob.id);
    assert(
      !bob.sessionId,
      "Players in lobby response must not expose sessionId",
    );
  });

  it("should allow multiple players to join a lobby", async () => {
    const createResponse = await request(api)
      .post("/lobby/create")
      .send({ playerName: "Alice" })
      .expect(200);
    const lobbyId = createResponse.body.data.lobby.id;

    await request(api)
      .post(`/lobby/${lobbyId}/join`)
      .send({ playerName: "Bob" })
      .expect(201);

    const join2 = await request(api)
      .post(`/lobby/${lobbyId}/join`)
      .send({ playerName: "Carol" })
      .expect(201);

    assert.equal(join2.body.data.lobby.players.length, 3);
    assert.equal(join2.body.data.lobby.players[2].name, "Carol");
  });

  it("should return 404 when joining a lobby that does not exist", async () => {
    const response = await request(api)
      .post("/lobby/nonexistent-id/join")
      .send({ playerName: "Alice" })
      .expect("Content-Type", /json/)
      .expect(404);

    assert.equal(response.body.status, "error");
    assert.equal(response.body.error, "Lobby not found");
  });
});
