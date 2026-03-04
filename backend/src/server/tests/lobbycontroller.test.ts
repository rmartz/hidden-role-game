import express from "express";
import { describe, it } from "node:test";
import assert from "node:assert";
import { GameListService } from "../services/GameListService.js";
import { setupTestRoutes } from "./setup.js";
import request from "supertest";

const api = express();

api.use(express.urlencoded({ extended: true }));
api.use(express.json());

const gameListService = new GameListService();
setupTestRoutes(api, gameListService);

describe("LobbyController", () => {
  it("should create a game", async () => {
    const response = await request(api)
      .post("/lobby/create")
      .expect("Content-Type", /json/)
      .expect(200);

    assert.equal(
      response.body.status,
      "success",
      "Response status should be success",
    );
    assert(response.body.data.id, "Lobby should have an id");
    assert(
      Array.isArray(response.body.data.players),
      "Lobby should have a players array",
    );
    assert.equal(
      response.body.data.players.length,
      0,
      "New lobby should have no players",
    );
  });

  it("should get a game by id", async () => {
    const createResponse = await request(api).post("/lobby/create").expect(200);
    const gameId = createResponse.body.data.id;

    const getResponse = await request(api)
      .get(`/lobby/${gameId}`)
      .expect("Content-Type", /json/)
      .expect(200);

    assert.equal(
      getResponse.body.status,
      "success",
      "Response status should be success",
    );
    assert.equal(getResponse.body.data.id, gameId, "Lobby id should match");
    assert(
      Array.isArray(getResponse.body.data.players),
      "Lobby should have a players array",
    );
  });

  it("should return 404 when getting a game that does not exist", async () => {
    const response = await request(api)
      .get("/lobby/nonexistent-game-id")
      .expect("Content-Type", /json/)
      .expect(404);

    assert.equal(
      response.body.status,
      "error",
      "Response status should be error",
    );
    assert.equal(
      response.body.error,
      "Game not found",
      "Error message should indicate game not found",
    );
  });

  it("should allow a player to join a game", async () => {
    const createResponse = await request(api).post("/lobby/create").expect(200);
    const gameId = createResponse.body.data.id;

    const joinResponse = await request(api)
      .post(`/lobby/${gameId}/join`)
      .send({ playerName: "Alice" })
      .expect("Content-Type", /json/)
      .expect(201);

    assert.equal(
      joinResponse.body.status,
      "success",
      "Response status should be success",
    );
    assert.equal(joinResponse.body.data.id, gameId, "Lobby id should match");
    assert.equal(
      joinResponse.body.data.players.length,
      1,
      "Lobby should have one player",
    );

    const player = joinResponse.body.data.players[0];
    assert.equal(player.name, "Alice", "Player name should be Alice");
    assert(player.id, "Player should have an id");
  });

  it("should allow multiple players to join a game", async () => {
    const createResponse = await request(api).post("/lobby/create").expect(200);
    const gameId = createResponse.body.data.id;

    const join1 = await request(api)
      .post(`/lobby/${gameId}/join`)
      .send({ playerName: "Alice" })
      .expect(201);

    assert.equal(join1.body.data.players.length, 1);

    const join2 = await request(api)
      .post(`/lobby/${gameId}/join`)
      .send({ playerName: "Bob" })
      .expect(201);

    assert.equal(
      join2.body.data.players.length,
      2,
      "Lobby should have two players",
    );
    assert.equal(
      join2.body.data.players[1].name,
      "Bob",
      "Second player name should be Bob",
    );
  });

  it("should return 404 when joining a game that does not exist", async () => {
    const response = await request(api)
      .post("/lobby/nonexistent-id/join")
      .send({ playerName: "Alice" })
      .expect("Content-Type", /json/)
      .expect(404);

    assert.equal(
      response.body.status,
      "error",
      "Response status should be error",
    );
    assert.equal(
      response.body.error,
      "Game not found",
      "Error message should indicate game not found",
    );
  });
});
