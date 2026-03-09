import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ServerResponseStatus } from "@/server/models";
import type { PlayerGameState } from "@/server/models";
import { createWrapper } from "./test-utils";

vi.mock("@/lib/api", () => ({
  startGame: vi.fn(),
  getGameState: vi.fn(),
}));

import * as api from "@/lib/api";
import { useStartGame, useGameStateQuery } from "./game";

const mockGameState: PlayerGameState = {
  status: "in_progress",
  players: [{ id: "player-1", name: "Alice" }],
  myRole: { id: "villager", name: "Villager", team: "good" },
  visibleTeammates: [],
  rolesInPlay: null,
  isGameOwner: false,
  allRoleAssignments: null,
};

const mockOwnerGameState: PlayerGameState = {
  ...mockGameState,
  isGameOwner: true,
  allRoleAssignments: [
    {
      player: { id: "player-1", name: "Alice" },
      role: { id: "villager", name: "Villager", team: "good" },
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
      data: { gameId: "game-1" },
    });

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useStartGame("lobby-1"), { wrapper });

    act(() => {
      result.current.mutate({ roleSlots: [], gameMode: "werewolf" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.startGame).toHaveBeenCalledWith("lobby-1", [], "werewolf");
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
      result.current.mutate({ roleSlots: [], gameMode: "werewolf" });
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
    const { result } = renderHook(() => useGameStateQuery("game-1"), {
      wrapper,
    });

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
    const { result } = renderHook(() => useGameStateQuery("game-1"), {
      wrapper,
    });

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
    const { result } = renderHook(() => useGameStateQuery("game-1"), {
      wrapper,
    });

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
    const { result } = renderHook(() => useGameStateQuery("game-1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe("Game not found");
  });

  it("returns owner state with allRoleAssignments when isGameOwner is true", async () => {
    vi.mocked(api.getGameState).mockResolvedValue({
      data: { status: ServerResponseStatus.Success, data: mockOwnerGameState },
      httpStatus: 200,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useGameStateQuery("game-1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.isGameOwner).toBe(true);
    expect(result.current.data?.allRoleAssignments).toHaveLength(1);
  });
});
