import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  act,
  fireEvent,
} from "@testing-library/react";
import { OwnerStartingScreen } from "./OwnerStartingScreen";
import { GameStatus, GameMode, Team } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import { OWNER_STARTING_SCREEN_COPY } from "./OwnerStartingScreen.copy";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";

afterEach(cleanup);

interface SessionStorageMock {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  key: ReturnType<typeof vi.fn>;
  length: number;
}

function makeSessionStorageMock(
  initialData: Record<string, string> = {},
): SessionStorageMock {
  const store = new Map<string, string>(Object.entries(initialData));
  return {
    getItem: vi.fn((key: string): string | null => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    key: vi.fn(),
    length: 0,
  };
}

function makeGameState(
  overrides: Partial<WerewolfPlayerGameState> = {},
): WerewolfPlayerGameState {
  return {
    status: { type: GameStatus.Starting },
    gameMode: GameMode.Werewolf,
    lobbyId: "lobby-1",
    players: [
      { id: "p1", name: "Alice" },
      { id: "nd1", name: "Charlie", noDevice: true },
      { id: "nd2", name: "Diana", noDevice: true },
    ],
    visibleRoleAssignments: [
      {
        player: { id: "p1", name: "Alice" },
        reason: "revealed" as const,
        role: { id: "villager", name: "Villager", team: Team.Good },
      },
      {
        player: { id: "nd1", name: "Charlie" },
        reason: "revealed" as const,
        role: { id: "werewolf", name: "Werewolf", team: Team.Bad },
      },
      {
        player: { id: "nd2", name: "Diana" },
        reason: "revealed" as const,
        role: { id: "seer", name: "Seer", team: Team.Good },
      },
    ],
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    nominationsEnabled: false,
    trialsPerDay: 0,
    revealProtections: false,
    autoRevealNightOutcome: true,
    ...overrides,
  };
}

describe("OwnerStartingScreen no-device tap-to-reveal grid", () => {
  let storageMock: SessionStorageMock;

  beforeEach(() => {
    storageMock = makeSessionStorageMock();
    vi.stubGlobal("sessionStorage", storageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders reveal buttons for each no-device player", () => {
    render(
      <OwnerStartingScreen
        gameId="game-1"
        gameState={makeGameState()}
        onStart={vi.fn()}
      />,
    );

    expect(screen.getByText("Charlie")).toBeDefined();
    expect(screen.getByText("Diana")).toBeDefined();
    expect(
      screen.getAllByText(OWNER_STARTING_SCREEN_COPY.noDeviceRevealPrompt),
    ).toHaveLength(2);
  });

  it("buttons are enabled after hydration even when sessionStorage throws", () => {
    const neverResolvesMock = makeSessionStorageMock();
    neverResolvesMock.getItem.mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    vi.stubGlobal("sessionStorage", neverResolvesMock);

    render(
      <OwnerStartingScreen
        gameId="game-1"
        gameState={makeGameState()}
        onStart={vi.fn()}
      />,
    );

    // Even when storage throws, the finally block ensures hydration completes,
    // so buttons should be enabled (not stuck disabled forever).
    const charlieButton = screen.getByText("Charlie").closest("button");
    expect(charlieButton?.disabled).toBe(false);
  });

  it("previously-viewed cards are disabled on mount when sessionStorage has data", () => {
    const sessionStorageKey = "no-device-roles-viewed-game-1";
    const hydratedMock = makeSessionStorageMock({
      [sessionStorageKey]: JSON.stringify(["nd1"]),
    });
    vi.stubGlobal("sessionStorage", hydratedMock);

    render(
      <OwnerStartingScreen
        gameId="game-1"
        gameState={makeGameState()}
        onStart={vi.fn()}
      />,
    );

    const charlieButton = screen.getByText("Charlie").closest("button");
    const dianaButton = screen.getByText("Diana").closest("button");
    // nd1 (Charlie) was already viewed — button should be disabled
    expect(charlieButton?.disabled).toBe(true);
    // nd2 (Diana) was not viewed — button should be enabled
    expect(dianaButton?.disabled).toBe(false);
  });

  it("clicking an unviewed card reveals the role name but does not lock the card", () => {
    render(
      <OwnerStartingScreen
        gameId="game-1"
        gameState={makeGameState()}
        onStart={vi.fn()}
      />,
    );

    const charlieButton = screen.getByText("Charlie").closest("button");
    expect(charlieButton?.disabled).toBe(false);

    act(() => {
      if (charlieButton) fireEvent.click(charlieButton);
    });

    // Role name should be visible during the revealing phase
    expect(screen.getByText("Werewolf")).toBeDefined();
    // Button should still be enabled — second tap locks the card
    expect(charlieButton?.disabled).toBe(false);
    // sessionStorage should NOT be written until the card is locked
    const { setItem } = storageMock;
    expect(setItem).not.toHaveBeenCalled();
  });

  it("tapping a revealed card a second time locks it and hides the role name", () => {
    render(
      <OwnerStartingScreen
        gameId="game-1"
        gameState={makeGameState()}
        onStart={vi.fn()}
      />,
    );

    const charlieButton = screen.getByText("Charlie").closest("button");

    act(() => {
      if (charlieButton) fireEvent.click(charlieButton);
    });
    // First tap: role name visible
    expect(screen.getByText("Werewolf")).toBeDefined();

    act(() => {
      if (charlieButton) fireEvent.click(charlieButton);
    });
    // Second tap: role name hidden, card locked
    expect(screen.queryByText("Werewolf")).toBeNull();
    expect(charlieButton?.disabled).toBe(true);
    // sessionStorage written on lock
    const { setItem } = storageMock;
    expect(setItem).toHaveBeenCalledWith(
      "no-device-roles-viewed-game-1",
      JSON.stringify(["nd1"]),
    );
  });

  it("does not show the role name on a card that has already been viewed", () => {
    const sessionStorageKey = "no-device-roles-viewed-game-1";
    const hydratedMock = makeSessionStorageMock({
      [sessionStorageKey]: JSON.stringify(["nd1"]),
    });
    vi.stubGlobal("sessionStorage", hydratedMock);

    render(
      <OwnerStartingScreen
        gameId="game-1"
        gameState={makeGameState()}
        onStart={vi.fn()}
      />,
    );

    // nd1 (Charlie) was already viewed — button disabled, role name hidden
    const charlieButton = screen.getByText("Charlie").closest("button");
    expect(charlieButton?.disabled).toBe(true);
    expect(screen.queryByText("Werewolf")).toBeNull();
    // nd2 (Diana) was not viewed — only prompt text shown
    expect(
      screen.getAllByText(OWNER_STARTING_SCREEN_COPY.noDeviceRevealPrompt),
    ).toHaveLength(1);
  });

  it("shows the already-viewed label on a viewed card when its role is unknown", () => {
    const sessionStorageKey = "no-device-roles-viewed-game-1";
    const hydratedMock = makeSessionStorageMock({
      [sessionStorageKey]: JSON.stringify(["nd1"]),
    });
    vi.stubGlobal("sessionStorage", hydratedMock);

    const gameState = makeGameState({
      // Provide no role assignments — alreadyViewed but role is undefined
      visibleRoleAssignments: [],
    });

    render(
      <OwnerStartingScreen
        gameId="game-1"
        gameState={gameState}
        onStart={vi.fn()}
      />,
    );

    expect(
      screen.getByText(OWNER_STARTING_SCREEN_COPY.noDeviceAlreadyViewed),
    ).toBeDefined();
  });

  it("does not render the no-device grid when there are no no-device players", () => {
    const gameState = makeGameState({
      players: [{ id: "p1", name: "Alice" }],
      visibleRoleAssignments: [
        {
          player: { id: "p1", name: "Alice" },
          reason: "revealed" as const,
          role: { id: "villager", name: "Villager", team: Team.Good },
        },
      ],
    });

    render(
      <OwnerStartingScreen
        gameId="game-1"
        gameState={gameState}
        onStart={vi.fn()}
      />,
    );

    expect(
      screen.queryByText(OWNER_STARTING_SCREEN_COPY.noDeviceRolesTitle),
    ).toBeNull();
  });

  it("clears sessionStorage when handleStart is called", () => {
    const onStart = vi.fn();
    render(
      <OwnerStartingScreen
        gameId="game-1"
        gameState={makeGameState()}
        onStart={onStart}
      />,
    );

    act(() => {
      fireEvent.click(screen.getByText(OWNER_STARTING_SCREEN_COPY.startButton));
    });

    const { removeItem } = storageMock;
    expect(removeItem).toHaveBeenCalledWith("no-device-roles-viewed-game-1");
    expect(onStart).toHaveBeenCalledOnce();
  });
});
