import { describe, it, expect } from "vitest";
import { isValidSession, toPublicLobby } from "./lobby-helpers";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import type { Lobby } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game-modes/secret-villain/timer-config";
import { DEFAULT_SECRET_VILLAIN_MODE_CONFIG } from "@/lib/game-modes/secret-villain/lobby-config";

function makeLobby(overrides: Partial<Lobby> = {}): Lobby {
  return {
    id: "lobby-1",
    ownerSessionId: "session-owner",
    players: [
      { id: "player-1", name: "Alice", sessionId: "session-owner" },
      { id: "player-2", name: "Bob", sessionId: "session-bob" },
    ],
    config: {
      gameMode: GameMode.SecretVillain,
      roleConfigMode: RoleConfigMode.Default,
      roleSlots: [{ roleId: "good", min: 2, max: 2 }],
      showConfigToPlayers: false,
      showRolesInPlay: ShowRolesInPlay.None,
      modeConfig: DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
      timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    },
    readyPlayerIds: [],
    ...overrides,
  };
}

describe("isValidSession", () => {
  it("returns true when a player with the given sessionId exists", () => {
    const lobby = makeLobby();
    expect(isValidSession(lobby, "session-owner")).toBe(true);
    expect(isValidSession(lobby, "session-bob")).toBe(true);
  });

  it("returns false when no player has the given sessionId", () => {
    const lobby = makeLobby();
    expect(isValidSession(lobby, "session-unknown")).toBe(false);
  });

  it("returns false for an empty player list", () => {
    const lobby = makeLobby({ players: [] });
    expect(isValidSession(lobby, "session-owner")).toBe(false);
  });
});

describe("toPublicLobby", () => {
  it("strips sessionId from all players", () => {
    const lobby = makeLobby();
    const result = toPublicLobby(lobby);
    for (const player of result.players) {
      expect(player).not.toHaveProperty("sessionId");
    }
  });

  it("sets ownerPlayerId to the owner's player id", () => {
    const lobby = makeLobby();
    const result = toPublicLobby(lobby);
    expect(result.ownerPlayerId).toBe("player-1");
  });

  it("sets ownerPlayerId to empty string when no owner player is found", () => {
    const lobby = makeLobby({ ownerSessionId: "session-nonexistent" });
    const result = toPublicLobby(lobby);
    expect(result.ownerPlayerId).toBe("");
  });

  it("omits gameId when the lobby has no game", () => {
    const lobby = makeLobby();
    const result = toPublicLobby(lobby);
    expect(result).not.toHaveProperty("gameId");
  });

  it("includes gameId when the lobby has a game", () => {
    const lobby = makeLobby({ gameId: "game-abc" });
    const result = toPublicLobby(lobby);
    expect(result.gameId).toBe("game-abc");
  });

  describe("roleSlots visibility", () => {
    it("includes roleSlots for the owner", () => {
      const lobby = makeLobby();
      const result = toPublicLobby(lobby, "session-owner");
      expect(result.config.roleSlots).toEqual(lobby.config.roleSlots);
    });

    it("includes roleSlots for non-owners when showConfigToPlayers is true", () => {
      const lobby = makeLobby({
        config: {
          gameMode: GameMode.SecretVillain,
          roleConfigMode: RoleConfigMode.Default,
          roleSlots: [{ roleId: "good", min: 2, max: 2 }],
          showConfigToPlayers: true,
          showRolesInPlay: ShowRolesInPlay.None,
          modeConfig: DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
          timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
        },
      });
      const result = toPublicLobby(lobby, "session-bob");
      expect(result.config.roleSlots).toEqual(lobby.config.roleSlots);
    });

    it("omits roleSlots for non-owners when showConfigToPlayers is false", () => {
      const lobby = makeLobby();
      const result = toPublicLobby(lobby, "session-bob");
      expect(result.config).not.toHaveProperty("roleSlots");
    });

    it("omits roleSlots for anonymous callers when showConfigToPlayers is false", () => {
      const lobby = makeLobby();
      const result = toPublicLobby(lobby);
      expect(result.config).not.toHaveProperty("roleSlots");
    });
  });
});
