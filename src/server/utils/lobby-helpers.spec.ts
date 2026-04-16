import { describe, it, expect } from "vitest";
import { isValidSession, toPublicLobby } from "./lobby-helpers";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import type { Lobby, RoleBucket } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import { DEFAULT_SECRET_VILLAIN_MODE_CONFIG } from "@/lib/game/modes/secret-villain/lobby-config";

const DEFAULT_BUCKETS: RoleBucket[] = [
  { playerCount: 2, roles: [{ roleId: "good" }] },
];

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
      roleBuckets: DEFAULT_BUCKETS,
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
  it("includes playerOrder in the public lobby", () => {
    const lobby = makeLobby({ playerOrder: ["player-2", "player-1"] });
    const result = toPublicLobby(lobby);
    expect(result.playerOrder).toEqual(["player-2", "player-1"]);
  });

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

  describe("roleBuckets visibility", () => {
    it("includes roleBuckets for the owner", () => {
      const lobby = makeLobby();
      const result = toPublicLobby(lobby, "session-owner");
      expect(result.config.roleBuckets).toEqual(lobby.config.roleBuckets);
    });

    it("includes roleBuckets for non-owners when showConfigToPlayers is true", () => {
      const lobby = makeLobby({
        config: {
          gameMode: GameMode.SecretVillain,
          roleConfigMode: RoleConfigMode.Default,
          roleBuckets: DEFAULT_BUCKETS,
          showConfigToPlayers: true,
          showRolesInPlay: ShowRolesInPlay.None,
          modeConfig: DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
          timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
        },
      });
      const result = toPublicLobby(lobby, "session-bob");
      expect(result.config.roleBuckets).toEqual(lobby.config.roleBuckets);
    });

    it("returns empty roleBuckets for non-owners when showConfigToPlayers is false", () => {
      const lobby = makeLobby();
      const result = toPublicLobby(lobby, "session-bob");
      expect(result.config.roleBuckets).toEqual([]);
    });

    it("returns empty roleBuckets for anonymous callers when showConfigToPlayers is false", () => {
      const lobby = makeLobby();
      const result = toPublicLobby(lobby);
      expect(result.config.roleBuckets).toEqual([]);
    });
  });
});
