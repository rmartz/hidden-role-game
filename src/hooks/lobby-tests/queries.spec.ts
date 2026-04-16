import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import { ServerResponseStatus } from "@/server/types";
import type { PublicLobby } from "@/server/types";
import { createWrapper } from "../test-utils";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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
  useStoredLobbyQuery,
  useLobbyQuery,
  useLobbyExistsQuery,
} from "../lobby";

const mockLobby: PublicLobby = {
  id: "lobby-1",
  ownerPlayerId: "player-1",
  players: [{ id: "player-1", name: "Alice" }],
  playerOrder: ["player-1"],
  config: {
    gameMode: GameMode.Werewolf,
    roleConfigMode: RoleConfigMode.Default,
    roleBuckets: [],
    showConfigToPlayers: false,
    showRolesInPlay: ShowRolesInPlay.RoleAndCount,
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: false,
      trialsPerDay: 1,
      revealProtections: true,
      showRolesOnDeath: true,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  },
  readyPlayerIds: [],
};

beforeEach(() => {
  vi.clearAllMocks();
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

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

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

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

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

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.clearSession).toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });

  it("returns null when storedLobbyId is undefined", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useStoredLobbyQuery(undefined), {
      wrapper,
    });

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

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

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

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe("404");
  });

  it("throws on 403", async () => {
    vi.mocked(api.getLobby).mockResolvedValue({
      data: { status: ServerResponseStatus.Error, error: "Forbidden" },
      httpStatus: 403,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useLobbyQuery("lobby-1", { enabled: true }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe("403");
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

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
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

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
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

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toBe(false);
  });
});
