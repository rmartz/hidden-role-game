import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  GameMode,
  GameStatus,
  RoleConfigMode,
  ShowRolesInPlay,
  Team,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import { ServerResponseStatus } from "@/server/types";
import type { PlayerGameState, PublicLobby } from "@/server/types";
import type { WerewolfPlayerGameState } from "@/lib/game-modes/werewolf/player-state";
import { createWrapper } from "./test-utils";

vi.mock("@/lib/api", () => ({
  startGame: vi.fn(),
  getGameState: vi.fn(),
  getSessionId: vi.fn().mockReturnValue("session-1"),
}));

vi.mock("firebase/database", () => ({
  ref: vi.fn(),
  onValue: vi.fn(() => () => undefined),
  off: vi.fn(),
}));

vi.mock("@/lib/firebase/client", () => ({
  getClientDatabase: vi.fn(() => ({})),
}));

vi.mock("@/hooks/firebaseAuth", () => ({
  useFirebaseAuth: vi.fn().mockReturnValue({ isReady: true }),
}));

import * as api from "@/lib/api";
import { useStartGame, useGameStateQuery } from "./game";

const mockGameState: WerewolfPlayerGameState = {
  status: { type: GameStatus.Playing },
  gameMode: GameMode.SecretVillain,
  lobbyId: "lobby-1",
  players: [{ id: "player-1", name: "Alice" }],
  gameOwner: undefined,
  myPlayerId: "player-1",
  myRole: { id: "villager", name: "Villager", team: Team.Good },
  visibleRoleAssignments: [],
  rolesInPlay: undefined,
  nominationsEnabled: false,
  singleTrialPerDay: true,
  revealProtections: true,
  timerConfig: DEFAULT_TIMER_CONFIG,
};

const mockOwnerGameState: PlayerGameState = {
  ...mockGameState,
  gameOwner: { id: "player-1", name: "Alice" },
  myRole: undefined,
  visibleRoleAssignments: [
    {
      player: { id: "player-1", name: "Alice" },
      reason: "revealed",
      role: { id: "villager", name: "Villager", team: Team.Good },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useStartGame", () => {
  it("calls startGame and invalidates lobby query on success", async () => {
    vi.mocked(api.startGame).mockResolvedValue({
      status: ServerResponseStatus.Success,
      data: {
        lobby: {
          id: "lobby-1",
          ownerPlayerId: "player-1",
          players: [],
          config: {
            gameMode: GameMode.SecretVillain,
            roleConfigMode: RoleConfigMode.Default,
            showConfigToPlayers: false,
            showRolesInPlay: ShowRolesInPlay.RoleAndCount,
            nominationsEnabled: false,
            singleTrialPerDay: true,
            revealProtections: true,
            timerConfig: DEFAULT_TIMER_CONFIG,
          },
          gameId: "game-1",
          readyPlayerIds: [],
        } satisfies PublicLobby,
      },
    });

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useStartGame("lobby-1"), { wrapper });

    act(() => {
      result.current.mutate({ gameMode: GameMode.Werewolf });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.startGame).toHaveBeenCalledWith("lobby-1", "werewolf");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["lobby", "lobby-1"],
    });
  });

  it("does not invalidate on server error", async () => {
    vi.mocked(api.startGame).mockResolvedValue({
      status: ServerResponseStatus.Error,
      error: "Not enough players",
    });

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useStartGame("lobby-1"), { wrapper });

    act(() => {
      result.current.mutate({ gameMode: GameMode.Werewolf });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("useGameStateQuery", () => {
  it("returns game state on success", async () => {
    vi.mocked(api.getGameState).mockResolvedValue({
      data: { status: ServerResponseStatus.Success, data: mockGameState },
      httpStatus: 200,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useGameStateQuery("game-1", GameMode.SecretVillain),
      {
        wrapper,
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockGameState);
  });

  it("throws on 401", async () => {
    vi.mocked(api.getGameState).mockResolvedValue({
      data: { status: ServerResponseStatus.Error, error: "Unauthorized" },
      httpStatus: 401,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useGameStateQuery("game-1", GameMode.SecretVillain),
      {
        wrapper,
      },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe("401");
  });

  it("throws on 403", async () => {
    vi.mocked(api.getGameState).mockResolvedValue({
      data: { status: ServerResponseStatus.Error, error: "Forbidden" },
      httpStatus: 403,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useGameStateQuery("game-1", GameMode.SecretVillain),
      {
        wrapper,
      },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe("403");
  });

  it("throws on server error response", async () => {
    vi.mocked(api.getGameState).mockResolvedValue({
      data: { status: ServerResponseStatus.Error, error: "Game not found" },
      httpStatus: 500,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useGameStateQuery("game-1", GameMode.SecretVillain),
      {
        wrapper,
      },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe("Game not found");
  });

  it("returns owner state with visibleRoleAssignments when gameOwner is set", async () => {
    vi.mocked(api.getGameState).mockResolvedValue({
      data: { status: ServerResponseStatus.Success, data: mockOwnerGameState },
      httpStatus: 200,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useGameStateQuery("game-1", GameMode.SecretVillain),
      {
        wrapper,
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.gameOwner).toBeDefined();
    expect(result.current.data?.visibleRoleAssignments).toHaveLength(1);
  });
});
