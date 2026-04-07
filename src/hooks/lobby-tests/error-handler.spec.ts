import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../test-utils";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));
vi.mock("@/lib/api", () => ({
  clearSession: vi.fn(),
}));

// Import after mocks are declared.
import * as api from "@/lib/api";
import { useLobbyErrorHandler } from "../lobby";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useLobbyErrorHandler", () => {
  it("does nothing when there is no error", () => {
    const onSessionCleared = vi.fn();
    const { wrapper } = createWrapper();
    renderHook(
      () => {
        useLobbyErrorHandler(undefined, "lobby-1", onSessionCleared);
      },
      { wrapper },
    );
    expect(mockPush).not.toHaveBeenCalled();
    expect(api.clearSession).not.toHaveBeenCalled();
    expect(onSessionCleared).not.toHaveBeenCalled();
  });

  it("redirects to home on 404", async () => {
    const onSessionCleared = vi.fn();
    const { wrapper } = createWrapper();
    renderHook(
      () => {
        useLobbyErrorHandler(new Error("404"), "lobby-1", onSessionCleared);
      },
      { wrapper },
    );
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
    expect(api.clearSession).not.toHaveBeenCalled();
    expect(onSessionCleared).not.toHaveBeenCalled();
  });

  it("clears session and calls onSessionCleared on 403", async () => {
    const onSessionCleared = vi.fn();
    const { wrapper, queryClient } = createWrapper();
    renderHook(
      () => {
        useLobbyErrorHandler(new Error("403"), "lobby-1", onSessionCleared);
      },
      { wrapper },
    );
    await waitFor(() => {
      expect(api.clearSession).toHaveBeenCalledOnce();
    });
    expect(onSessionCleared).toHaveBeenCalledOnce();
    expect(mockPush).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(["lobby", "lobby-1"])).toBeNull();
  });

  it("sets query data to null on 403 to render JoinPrompt immediately", async () => {
    const onSessionCleared = vi.fn();
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(["lobby", "lobby-1"], { id: "lobby-1" });

    renderHook(
      () => {
        useLobbyErrorHandler(new Error("403"), "lobby-1", onSessionCleared);
      },
      { wrapper },
    );
    await waitFor(() => {
      expect(queryClient.getQueryData(["lobby", "lobby-1"])).toBeNull();
    });
  });

  it("does not redirect or clear session for unrelated errors", () => {
    const onSessionCleared = vi.fn();
    const { wrapper } = createWrapper();
    renderHook(
      () => {
        useLobbyErrorHandler(new Error("500"), "lobby-1", onSessionCleared);
      },
      { wrapper },
    );
    expect(mockPush).not.toHaveBeenCalled();
    expect(api.clearSession).not.toHaveBeenCalled();
    expect(onSessionCleared).not.toHaveBeenCalled();
  });
});
