import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  errorResponse,
  authenticateLobby,
  authenticateGame,
} from "./api-helpers";
import { ServerResponseStatus } from "@/server/types";
import {
  GameMode,
  GameStatus,
  RoleConfigMode,
  ShowRolesInPlay,
} from "@/lib/types";
import type { Lobby, Game, GamePlayer } from "@/lib/types";

const { mockGetLobby, mockGetGame } = vi.hoisted(() => ({
  mockGetLobby: vi.fn(),
  mockGetGame: vi.fn(),
}));

vi.mock("@/services/LobbyService", () => ({
  lobbyService: { getLobby: mockGetLobby },
}));

vi.mock("@/services/GameService", () => ({
  gameService: { getGame: mockGetGame },
}));

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
      roleSlots: [],
      showConfigToPlayers: false,
      showRolesInPlay: ShowRolesInPlay.None,
    },
    ...overrides,
  };
}

function makeGame(overrides: Partial<Game> = {}): Game {
  const players: GamePlayer[] = [
    {
      id: "player-1",
      name: "Alice",
      sessionId: "session-alice",
      visibleRoles: [],
    },
  ];
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: { type: GameStatus.Playing },
    players,
    roleAssignments: [],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("errorResponse", () => {
  it("returns a Response with the given HTTP status code", () => {
    const res = errorResponse("Something went wrong", 404);
    expect(res.status).toBe(404);
  });

  it("returns JSON with ServerResponseStatus.Error and the error message", async () => {
    const res = errorResponse("Not found", 404);
    const body = (await res.json()) as { status: string; error: string };
    expect(body.status).toBe(ServerResponseStatus.Error);
    expect(body.error).toBe("Not found");
  });
});

describe("authenticateLobby", () => {
  it("returns 401 when sessionId is undefined", () => {
    const result = authenticateLobby("lobby-1", undefined);
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(401);
  });

  it("returns 404 when the lobby does not exist", () => {
    mockGetLobby.mockReturnValue(undefined);
    const result = authenticateLobby("lobby-1", "session-owner");
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(404);
  });

  it("returns 403 when sessionId is not a player in the lobby", () => {
    mockGetLobby.mockReturnValue(makeLobby());
    const result = authenticateLobby("lobby-1", "session-unknown");
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(403);
  });

  it("returns 403 when requireOwner is true and caller is not the owner", () => {
    mockGetLobby.mockReturnValue(makeLobby());
    const result = authenticateLobby("lobby-1", "session-bob", {
      requireOwner: true,
    });
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(403);
  });

  it("returns 409 when requireNoGame is true and a game has already started", () => {
    mockGetLobby.mockReturnValue(makeLobby({ gameId: "game-1" }));
    const result = authenticateLobby("lobby-1", "session-owner", {
      requireNoGame: true,
    });
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(409);
  });

  it("returns the lobby and sessionId on success", () => {
    const lobby = makeLobby();
    mockGetLobby.mockReturnValue(lobby);
    const result = authenticateLobby("lobby-1", "session-owner");
    expect(result instanceof Response).toBe(false);
    const { lobby: resultLobby, sessionId } = result as {
      lobby: Lobby;
      sessionId: string;
    };
    expect(resultLobby).toBe(lobby);
    expect(sessionId).toBe("session-owner");
  });

  it("succeeds for a non-owner when requireOwner is false", () => {
    mockGetLobby.mockReturnValue(makeLobby());
    const result = authenticateLobby("lobby-1", "session-bob");
    expect(result instanceof Response).toBe(false);
  });

  it("succeeds for the owner when requireOwner is true", () => {
    mockGetLobby.mockReturnValue(makeLobby());
    const result = authenticateLobby("lobby-1", "session-owner", {
      requireOwner: true,
    });
    expect(result instanceof Response).toBe(false);
  });

  it("succeeds when requireNoGame is true and no game has started", () => {
    mockGetLobby.mockReturnValue(makeLobby());
    const result = authenticateLobby("lobby-1", "session-owner", {
      requireNoGame: true,
    });
    expect(result instanceof Response).toBe(false);
  });
});

describe("authenticateGame", () => {
  it("returns 401 when sessionId is undefined", () => {
    const result = authenticateGame("game-1", undefined);
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(401);
  });

  it("returns 403 when the game does not exist", () => {
    mockGetGame.mockReturnValue(undefined);
    const result = authenticateGame("game-1", "session-alice");
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(403);
  });

  it("returns 403 when no player in the game has the given sessionId", () => {
    mockGetGame.mockReturnValue(makeGame());
    const result = authenticateGame("game-1", "session-unknown");
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(403);
  });

  it("returns the game and caller on success", () => {
    const game = makeGame();
    mockGetGame.mockReturnValue(game);
    const result = authenticateGame("game-1", "session-alice");
    expect(result instanceof Response).toBe(false);
    const { game: resultGame, caller } = result as {
      game: Game;
      caller: GamePlayer;
    };
    expect(resultGame).toBe(game);
    expect(caller.sessionId).toBe("session-alice");
  });
});
