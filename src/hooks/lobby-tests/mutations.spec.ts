import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  GameMode,
  RoleConfigMode,
  ShowRolesInPlay,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import { ServerResponseStatus } from "@/server/types";
import type { PublicLobby, LobbyJoinResponse } from "@/server/types";
import { createWrapper } from "../test-utils";

const mockPush = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));
vi.mock("@/lib/api", () => ({
  createLobby: vi.fn(),
  joinLobby: vi.fn(),
  removePlayer: vi.fn(),
  updateLobbyConfig: vi.fn(),
  getLobby: vi.fn(),
  clearSession: vi.fn(),
}));

import * as api from "@/lib/api";
import {
  useCreateLobby,
  useJoinLobby,
  useLeaveAndJoinLobby,
  useUpdateLobbyConfig,
} from "../lobby";

const mockLobby: PublicLobby = {
  id: "lobby-1",
  ownerPlayerId: "player-1",
  players: [{ id: "player-1", name: "Alice" }],
  config: {
    gameMode: GameMode.Werewolf,
    roleConfigMode: RoleConfigMode.Default,
    showConfigToPlayers: false,
    showRolesInPlay: ShowRolesInPlay.RoleAndCount,
    nominationsEnabled: false,
    singleTrialPerDay: true,
    revealProtections: true,
    timerConfig: DEFAULT_TIMER_CONFIG,
  },
  readyPlayerIds: [],
};
const mockJoinResponse: LobbyJoinResponse = {
  lobby: mockLobby,
  sessionId: "session-1",
  playerId: "player-1",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCreateLobby", () => {
  it("calls createLobby and redirects on success", async () => {
    vi.mocked(api.createLobby).mockResolvedValue({
      status: ServerResponseStatus.Success,
      data: mockJoinResponse,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateLobby(GameMode.Werewolf), {
      wrapper,
    });

    act(() => {
      result.current.mutate("Alice");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.createLobby).toHaveBeenCalledWith("Alice", GameMode.Werewolf);
    expect(mockPush).toHaveBeenCalledWith("/werewolf/lobby/lobby-1");
  });

  it("throws on server error", async () => {
    vi.mocked(api.createLobby).mockResolvedValue({
      status: ServerResponseStatus.Error,
      error: "Failed",
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateLobby(GameMode.Werewolf), {
      wrapper,
    });

    act(() => {
      result.current.mutate("Alice");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe("Failed");
  });
});

describe("useJoinLobby", () => {
  it("calls joinLobby and invokes onSuccess with data", async () => {
    vi.mocked(api.joinLobby).mockResolvedValue({
      status: ServerResponseStatus.Success,
      data: mockJoinResponse,
    });

    const onSuccess = vi.fn();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useJoinLobby(onSuccess), { wrapper });

    act(() => {
      result.current.mutate({ lobbyId: "lobby-1", playerName: "Alice" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.joinLobby).toHaveBeenCalledWith("lobby-1", "Alice");
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onSuccess.mock.calls[0]![0]).toEqual(mockJoinResponse);
  });

  it("throws on server error", async () => {
    vi.mocked(api.joinLobby).mockResolvedValue({
      status: ServerResponseStatus.Error,
      error: "Lobby full",
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useJoinLobby(vi.fn()), { wrapper });

    act(() => {
      result.current.mutate({ lobbyId: "lobby-1", playerName: "Alice" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe("Lobby full");
  });
});

describe("useLeaveAndJoinLobby", () => {
  it("removes player, clears session, joins new lobby, calls onSuccess", async () => {
    vi.mocked(api.removePlayer).mockResolvedValue({
      status: ServerResponseStatus.Success,
      data: { lobby: undefined },
    });
    vi.mocked(api.joinLobby).mockResolvedValue({
      status: ServerResponseStatus.Success,
      data: mockJoinResponse,
    });

    const onSuccess = vi.fn();
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLeaveAndJoinLobby(onSuccess), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        storedLobbyId: "lobby-old",
        myPlayerId: "player-1",
        lobbyId: "lobby-1",
        playerName: "Alice",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.removePlayer).toHaveBeenCalledWith("lobby-old", "player-1");
    expect(api.clearSession).toHaveBeenCalled();
    expect(api.joinLobby).toHaveBeenCalledWith("lobby-1", "Alice");
    expect(onSuccess).toHaveBeenCalled();
  });
});

describe("useUpdateLobbyConfig", () => {
  it("calls updateLobbyConfig and sets query data on success", async () => {
    const updatedLobby = {
      ...mockLobby,
      config: { ...mockLobby.config, showConfigToPlayers: true },
    };
    vi.mocked(api.updateLobbyConfig).mockResolvedValue({
      status: ServerResponseStatus.Success,
      data: { lobby: updatedLobby },
    });

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(["lobby", "lobby-1"], mockLobby);

    const { result } = renderHook(() => useUpdateLobbyConfig("lobby-1"), {
      wrapper,
    });

    act(() => {
      result.current.mutate({ showConfigToPlayers: true });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.updateLobbyConfig).toHaveBeenCalledWith("lobby-1", {
      showConfigToPlayers: true,
    });
    expect(queryClient.getQueryData(["lobby", "lobby-1"])).toEqual(
      updatedLobby,
    );
  });
});
