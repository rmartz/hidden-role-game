import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ServerResponseStatus } from "@/server/models";
import type { PublicLobby, LobbyJoinResponse } from "@/server/models";
import { createWrapper } from "./test-utils";

const mockPush = vi.hoisted(() => vi.fn());
const mockReplace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
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
  useStoredLobbyQuery,
  useLobbyQuery,
  useLobbyExistsQuery,
} from "./lobby";

const mockLobby: PublicLobby = {
  id: "lobby-1",
  ownerPlayerId: "player-1",
  players: [{ id: "player-1", name: "Alice" }],
  config: {
    gameMode: "werewolf",
    showConfigToPlayers: false,
    showRolesInPlay: false,
  },
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
    const { result } = renderHook(() => useCreateLobby(), { wrapper });

    act(() => {
      result.current.mutate("Alice");
    });

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

    expect(api.createLobby).toHaveBeenCalledWith("Alice");
    expect(mockPush).toHaveBeenCalledWith("/lobby/lobby-1");
  });

  it("throws on server error", async () => {
    vi.mocked(api.createLobby).mockResolvedValue({
      status: ServerResponseStatus.Error,
      error: "Failed",
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateLobby(), { wrapper });

    act(() => {
      result.current.mutate("Alice");
    });

    await waitFor(() => { expect(result.current.isError).toBe(true); });
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

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

    expect(api.joinLobby).toHaveBeenCalledWith("lobby-1", "Alice");
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onSuccess.mock.calls[0][0]).toEqual(mockJoinResponse);
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

    await waitFor(() => { expect(result.current.isError).toBe(true); });
    expect(result.current.error?.message).toBe("Lobby full");
  });
});

describe("useLeaveAndJoinLobby", () => {
  it("removes player, clears session, joins new lobby, calls onSuccess", async () => {
    vi.mocked(api.removePlayer).mockResolvedValue({
      status: ServerResponseStatus.Success,
      data: undefined,
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

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

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

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

    expect(api.updateLobbyConfig).toHaveBeenCalledWith("lobby-1", {
      showConfigToPlayers: true,
    });
    expect(queryClient.getQueryData(["lobby", "lobby-1"])).toEqual(
      updatedLobby,
    );
  });
});

describe("useStoredLobbyQuery", () => {
  it("returns lobby data on success", async () => {
    vi.mocked(api.getLobby).mockResolvedValue({
      data: { status: ServerResponseStatus.Success, data: mockLobby },
      httpStatus: 200,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useStoredLobbyQuery("lobby-1"), {
      wrapper,
    });

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

    expect(result.current.data).toEqual(mockLobby);
  });

  it("clears session and returns null on 404", async () => {
    vi.mocked(api.getLobby).mockResolvedValue({
      data: { status: ServerResponseStatus.Error, error: "Not found" },
      httpStatus: 404,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useStoredLobbyQuery("lobby-1"), {
      wrapper,
    });

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

    expect(api.clearSession).toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it("clears session and returns null on 403", async () => {
    vi.mocked(api.getLobby).mockResolvedValue({
      data: { status: ServerResponseStatus.Error, error: "Forbidden" },
      httpStatus: 403,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useStoredLobbyQuery("lobby-1"), {
      wrapper,
    });

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

    expect(api.clearSession).toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it("returns null when storedLobbyId is null", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useStoredLobbyQuery(null), { wrapper });

    // Query is disabled, so it stays in pending state without fetching
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.getLobby).not.toHaveBeenCalled();
  });
});

describe("useLobbyQuery", () => {
  it("returns lobby data on success", async () => {
    vi.mocked(api.getLobby).mockResolvedValue({
      data: { status: ServerResponseStatus.Success, data: mockLobby },
      httpStatus: 200,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useLobbyQuery("lobby-1", { enabled: true }),
      { wrapper },
    );

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

    expect(result.current.data).toEqual(mockLobby);
  });

  it("throws on 404", async () => {
    vi.mocked(api.getLobby).mockResolvedValue({
      data: { status: ServerResponseStatus.Error, error: "Not found" },
      httpStatus: 404,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useLobbyQuery("lobby-1", { enabled: true }),
      { wrapper },
    );

    await waitFor(() => { expect(result.current.isError).toBe(true); });
    expect(result.current.error?.message).toBe("404");
  });

  it("does not fetch when disabled", () => {
    const { wrapper } = createWrapper();
    renderHook(() => useLobbyQuery("lobby-1", { enabled: false }), { wrapper });

    expect(api.getLobby).not.toHaveBeenCalled();
  });
});

describe("useLobbyExistsQuery", () => {
  it("returns true when lobby exists (200)", async () => {
    vi.mocked(api.getLobby).mockResolvedValue({
      data: { status: ServerResponseStatus.Success, data: mockLobby },
      httpStatus: 200,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLobbyExistsQuery("lobby-1"), {
      wrapper,
    });

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });
    expect(result.current.data).toBe(true);
  });

  it("returns true on 403 (lobby exists, different session)", async () => {
    vi.mocked(api.getLobby).mockResolvedValue({
      data: { status: ServerResponseStatus.Error, error: "Forbidden" },
      httpStatus: 403,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLobbyExistsQuery("lobby-1"), {
      wrapper,
    });

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });
    expect(result.current.data).toBe(true);
  });

  it("returns false on 404", async () => {
    vi.mocked(api.getLobby).mockResolvedValue({
      data: { status: ServerResponseStatus.Error, error: "Not found" },
      httpStatus: 404,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLobbyExistsQuery("lobby-1"), {
      wrapper,
    });

    await waitFor(() => { expect(result.current.isSuccess).toBe(true); });
    expect(result.current.data).toBe(false);
  });
});
