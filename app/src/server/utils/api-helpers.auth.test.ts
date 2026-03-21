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
  DEFAULT_TIMER_CONFIG,
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
      nominationsEnabled: false,
      singleTrialPerDay: true,
      timerConfig: DEFAULT_TIMER_CONFIG,
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
      visiblePlayers: [],
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
    ownerPlayerId: undefined,
    nominationsEnabled: false,
    singleTrialPerDay: true,
    timerConfig: DEFAULT_TIMER_CONFIG,
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
  it("returns 401 when sessionId is undefined", async () => {
    const result = await authenticateLobby("lobby-1", undefined);
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(401);
  });

  it("returns 404 when the lobby does not exist", async () => {
    mockGetLobby.mockResolvedValue(undefined);
    const result = await authenticateLobby("lobby-1", "session-owner");
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(404);
  });

  it("returns 403 when sessionId is not a player in the lobby", async () => {
    mockGetLobby.mockResolvedValue(makeLobby());
    const result = await authenticateLobby("lobby-1", "session-unknown");
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(403);
  });

  it("returns 403 when requireOwner is true and caller is not the owner", async () => {
    mockGetLobby.mockResolvedValue(makeLobby());
    const result = await authenticateLobby("lobby-1", "session-bob", {
      requireOwner: true,
    });
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(403);
  });

  it("returns 409 when requireNoGame is true and a game has already started", async () => {
    mockGetLobby.mockResolvedValue(makeLobby({ gameId: "game-1" }));
    const result = await authenticateLobby("lobby-1", "session-owner", {
      requireNoGame: true,
    });
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(409);
  });

  it("returns the lobby and sessionId on success", async () => {
    const lobby = makeLobby();
    mockGetLobby.mockResolvedValue(lobby);
    const result = await authenticateLobby("lobby-1", "session-owner");
    expect(result instanceof Response).toBe(false);
    const { lobby: resultLobby, sessionId } = result as {
      lobby: Lobby;
      sessionId: string;
    };
    expect(resultLobby).toBe(lobby);
    expect(sessionId).toBe("session-owner");
  });

  it("succeeds for a non-owner when requireOwner is false", async () => {
    mockGetLobby.mockResolvedValue(makeLobby());
    const result = await authenticateLobby("lobby-1", "session-bob");
    expect(result instanceof Response).toBe(false);
  });

  it("succeeds for the owner when requireOwner is true", async () => {
    mockGetLobby.mockResolvedValue(makeLobby());
    const result = await authenticateLobby("lobby-1", "session-owner", {
      requireOwner: true,
    });
    expect(result instanceof Response).toBe(false);
  });

  it("succeeds when requireNoGame is true and no game has started", async () => {
    mockGetLobby.mockResolvedValue(makeLobby());
    const result = await authenticateLobby("lobby-1", "session-owner", {
      requireNoGame: true,
    });
    expect(result instanceof Response).toBe(false);
  });
});

describe("authenticateGame", () => {
  it("returns 401 when sessionId is undefined", async () => {
    const result = await authenticateGame("game-1", undefined);
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(401);
  });

  it("returns 403 when the game does not exist", async () => {
    mockGetGame.mockResolvedValue(undefined);
    const result = await authenticateGame("game-1", "session-alice");
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(403);
  });

  it("returns 403 when no player in the game has the given sessionId", async () => {
    mockGetGame.mockResolvedValue(makeGame());
    const result = await authenticateGame("game-1", "session-unknown");
    expect(result instanceof Response).toBe(true);
    expect((result as Response).status).toBe(403);
  });

  it("returns the game and caller on success", async () => {
    const game = makeGame();
    mockGetGame.mockResolvedValue(game);
    const result = await authenticateGame("game-1", "session-alice");
    expect(result instanceof Response).toBe(false);
    const { game: resultGame, caller } = result as {
      game: Game;
      caller: GamePlayer;
    };
    expect(resultGame).toBe(game);
    expect(caller.sessionId).toBe("session-alice");
  });
});
