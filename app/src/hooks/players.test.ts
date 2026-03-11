import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import { ServerResponseStatus } from "@/server/types";
import type { PublicLobby } from "@/server/types";
import { createWrapper } from "./test-utils";

const mockLobby: PublicLobby = {
  id: "lobby-1",
  ownerPlayerId: "player-2",
  players: [],
  config: {
    gameMode: GameMode.Werewolf,
    roleConfigMode: RoleConfigMode.Default,
    showConfigToPlayers: false,
    showRolesInPlay: ShowRolesInPlay.RoleAndCount,
  },
};

vi.mock("@/lib/api", () => ({
  removePlayer: vi.fn(),
  transferOwner: vi.fn(),
}));

import * as api from "@/lib/api";
import { useRemovePlayer, useTransferOwner } from "./players";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useRemovePlayer", () => {
  it("calls removePlayer and invokes onSuccess with targetPlayerId", async () => {
    vi.mocked(api.removePlayer).mockResolvedValue({
      status: ServerResponseStatus.Success,
      data: { lobby: null },
    });

    const onSuccess = vi.fn();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRemovePlayer("lobby-1", onSuccess), {
      wrapper,
    });

    act(() => {
      result.current.mutate("player-2");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.removePlayer).toHaveBeenCalledWith("lobby-1", "player-2");
    expect(onSuccess).toHaveBeenCalledWith("player-2");
  });

  it("does not invoke onSuccess on server error", async () => {
    vi.mocked(api.removePlayer).mockResolvedValue({
      status: ServerResponseStatus.Error,
      error: "Not authorized",
    });

    const onSuccess = vi.fn();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRemovePlayer("lobby-1", onSuccess), {
      wrapper,
    });

    act(() => {
      result.current.mutate("player-2");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("useTransferOwner", () => {
  it("calls transferOwner and invalidates lobby query on success", async () => {
    vi.mocked(api.transferOwner).mockResolvedValue({
      status: ServerResponseStatus.Success,
      data: { lobby: mockLobby },
    });

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useTransferOwner("lobby-1"), {
      wrapper,
    });

    act(() => {
      result.current.mutate("player-2");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.transferOwner).toHaveBeenCalledWith("lobby-1", "player-2");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["lobby", "lobby-1"],
    });
  });

  it("does not invalidate on server error", async () => {
    vi.mocked(api.transferOwner).mockResolvedValue({
      status: ServerResponseStatus.Error,
      error: "Not authorized",
    });

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useTransferOwner("lobby-1"), {
      wrapper,
    });

    act(() => {
      result.current.mutate("player-2");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
