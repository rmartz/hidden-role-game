import { describe, it, expect } from "vitest";
import { POST as advanceGame } from "./route";
import { setupStartedGame } from "../test-helpers";
import { makeGameParams } from "@/app/api/test-utils";

describe("POST /api/[gameMode]/game/[gameId]/advance", () => {
  it("should return 400 for an unknown game mode", async () => {
    const res = await advanceGame(
      new Request(
        "http://localhost/api/not-a-mode/game/nonexistent-id/advance",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      ),
      makeGameParams("nonexistent-id", "not-a-mode"),
    );
    expect(res.status).toBe(400);
  });

  it("should return 401 with no session header", async () => {
    const res = await advanceGame(
      new Request(
        "http://localhost/api/secret-villain/game/nonexistent-id/advance",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      ),
      makeGameParams("nonexistent-id", "secret-villain"),
    );
    expect(res.status).toBe(401);
  });

  it("should return 409 when game mode param does not match the game", async () => {
    const { gameId, aliceSession } = await setupStartedGame();

    const res = await advanceGame(
      new Request(`http://localhost/api/avalon/game/${gameId}/advance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": aliceSession,
        },
      }),
      makeGameParams(gameId, "avalon"),
    );
    expect(res.status).toBe(409);
  });
});
