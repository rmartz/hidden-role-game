import { describe, expect, it } from "vitest";

import { DEFAULT_TIMER_CONFIG, GameStatus } from "@/lib/types";

import { firebaseToPlayerState } from "../index";

describe("firebaseToPlayerState", () => {
  it("throws for unknown game mode", () => {
    // Deliberately malformed stored data: "unknown-mode" is not a GameMode, so
    // it is typed `unknown` rather than asserted into the enum-typed schema.
    const raw: unknown = {
      gameMode: "unknown-mode",
      statusJson: JSON.stringify({ type: GameStatus.Playing }),
      lobbyId: "lobby-1",
      gameOwner: null,
      myPlayerId: null,
      myRole: null,
      timerConfig: DEFAULT_TIMER_CONFIG,
    };
    expect(() =>
      firebaseToPlayerState(raw as Parameters<typeof firebaseToPlayerState>[0]),
    ).toThrow("Unknown game mode");
  });
});
