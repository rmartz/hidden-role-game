import { describe, it, expect } from "vitest";
import {
  validatePlayerJoin,
  validatePlayerRename,
  authorizePlayerRemoval,
  MAX_LOBBY_PLAYERS,
} from "./lobby";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import type { Lobby } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import { DEFAULT_SECRET_VILLAIN_MODE_CONFIG } from "@/lib/game/modes/secret-villain/lobby-config";

function makeLobby(overrides: Partial<Lobby> = {}): Lobby {
  return {
    id: "lobby-1",
    ownerSessionId: "session-owner",
    players: [
      { id: "player-1", name: "Alice", sessionId: "session-owner" },
      { id: "player-2", name: "Bob", sessionId: "session-bob" },
    ],
    playerOrder: ["player-1", "player-2"],
    config: {
      gameMode: GameMode.SecretVillain,
      roleConfigMode: RoleConfigMode.Default,
      roleBuckets: [],
      showConfigToPlayers: false,
      showRolesInPlay: ShowRolesInPlay.None,
      modeConfig: DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
      timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    },
    readyPlayerIds: [],
    ...overrides,
  };
}

describe("validatePlayerJoin", () => {
  it("returns undefined when the lobby has capacity and the name is unique", () => {
    expect(validatePlayerJoin(makeLobby(), "Charlie")).toBeUndefined();
  });

  it("returns an error when the lobby is at capacity", () => {
    const players = Array.from({ length: MAX_LOBBY_PLAYERS }, (_, i) => ({
      id: `p${String(i)}`,
      name: `Player ${String(i)}`,
      sessionId: `s${String(i)}`,
    }));
    const lobby = makeLobby({ players });
    expect(validatePlayerJoin(lobby, "NewPlayer")).toBeDefined();
  });

  it("returns an error when the display name matches an existing player (case-insensitive)", () => {
    expect(validatePlayerJoin(makeLobby(), "alice")).toBeDefined();
    expect(validatePlayerJoin(makeLobby(), "ALICE")).toBeDefined();
  });

  it("returns an error when the display name matches after whitespace normalization", () => {
    expect(validatePlayerJoin(makeLobby(), "  Alice  ")).toBeDefined();
  });

  it("returns an error when a countdown is in progress", () => {
    expect(
      validatePlayerJoin(
        makeLobby({ countdownStartedAt: Date.now() }),
        "Charlie",
      ),
    ).toBeDefined();
  });
});

describe("authorizePlayerRemoval", () => {
  it("returns undefined when the owner removes another player", () => {
    const lobby = makeLobby();
    expect(
      authorizePlayerRemoval(lobby, "player-2", "session-owner"),
    ).toBeUndefined();
  });

  it("returns undefined when a non-owner player removes themselves", () => {
    const lobby = makeLobby();
    expect(
      authorizePlayerRemoval(lobby, "player-2", "session-bob"),
    ).toBeUndefined();
  });

  it("returns an error when the caller is neither the owner nor the target player", () => {
    const lobby = makeLobby({
      players: [
        { id: "player-1", name: "Alice", sessionId: "session-owner" },
        { id: "player-2", name: "Bob", sessionId: "session-bob" },
        { id: "player-3", name: "Carol", sessionId: "session-carol" },
      ],
    });
    expect(
      authorizePlayerRemoval(lobby, "player-2", "session-carol"),
    ).toBeDefined();
  });

  it("returns an error when the owner attempts to remove themselves", () => {
    const lobby = makeLobby();
    expect(
      authorizePlayerRemoval(lobby, "player-1", "session-owner"),
    ).toBeDefined();
  });

  it("returns undefined when the owner removes a no-device player", () => {
    const lobby = makeLobby({
      players: [
        { id: "player-1", name: "Alice", sessionId: "session-owner" },
        { id: "player-nd", name: "NoDevice", noDevice: true },
      ],
    });
    expect(
      authorizePlayerRemoval(lobby, "player-nd", "session-owner"),
    ).toBeUndefined();
  });
});

describe("validatePlayerRename", () => {
  it("returns undefined when the renamed name is unique", () => {
    expect(
      validatePlayerRename(makeLobby(), "player-1", "Charlie"),
    ).toBeUndefined();
  });

  it("returns undefined when the renamed name normalizes to the same current player name", () => {
    expect(
      validatePlayerRename(makeLobby(), "player-1", " alice "),
    ).toBeUndefined();
  });

  it("returns an error when the renamed name matches another player", () => {
    expect(validatePlayerRename(makeLobby(), "player-1", "bob")).toBeDefined();
  });
});
