import { describe, expect, it } from "vitest";

import { makeGameParams } from "@/app/api/test-utils";

import { setupStartedSecretVillainGame } from "../test-helpers";
import { POST as doAction } from "./route";

describe("POST /api/[gameMode]/game/[gameId]/action", () => {
  it("should return 400 for an unknown game mode", async () => {
    const res = await doAction(
      new Request(
        "http://localhost/api/not-a-mode/game/nonexistent-id/action",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionId: "any" }),
        },
      ),
      makeGameParams("nonexistent-id", "not-a-mode"),
    );
    expect(res.status).toBe(400);
  });

  it("should return 401 with no session header", async () => {
    const res = await doAction(
      new Request(
        "http://localhost/api/secret-villain/game/nonexistent-id/action",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionId: "any" }),
        },
      ),
      makeGameParams("nonexistent-id", "secret-villain"),
    );
    expect(res.status).toBe(401);
  });

  it("should return 409 when game mode param does not match the game", async () => {
    const { gameId, aliceSession } = await setupStartedSecretVillainGame();

    const res = await doAction(
      new Request(`http://localhost/api/avalon/game/${gameId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
        body: JSON.stringify({ actionId: "any" }),
      }),
      makeGameParams(gameId, "avalon"),
    );
    expect(res.status).toBe(409);
  });
});
