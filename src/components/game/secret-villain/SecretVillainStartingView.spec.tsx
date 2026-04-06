import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SecretVillainStartingView } from "./SecretVillainStartingView";
import { GameStatus, GameMode, Team } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";

afterEach(cleanup);

function makeGameState(
  overrides: Partial<SecretVillainPlayerGameState> = {},
): SecretVillainPlayerGameState {
  return {
    status: { type: GameStatus.Starting, startedAt: Date.now() },
    gameMode: GameMode.SecretVillain,
    lobbyId: "lobby-1",
    players: [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
    ],
    visibleRoleAssignments: [],
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    ...overrides,
  } as SecretVillainPlayerGameState;
}

describe("SecretVillainStartingView", () => {
  it("shows heading and role name", () => {
    const gameState = makeGameState({
      myPlayerId: "p1",
      myRole: { id: "good", name: "Good Role", team: Team.Good },
    });
    render(<SecretVillainStartingView gameState={gameState} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.starting.heading),
    ).toBeDefined();
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.starting.yourRole("Good Role")),
    ).toBeDefined();
  });

  it("shows good team message for Good player", () => {
    const gameState = makeGameState({
      myPlayerId: "p1",
      myRole: { id: "good", name: "Good Role", team: Team.Good },
    });
    render(<SecretVillainStartingView gameState={gameState} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.starting.goodTeamMessage),
    ).toBeDefined();
  });

  it("shows special bad message for Special Bad player", () => {
    const gameState = makeGameState({
      myPlayerId: "p1",
      myRole: {
        id: "special-bad",
        name: "Special Bad Role",
        team: Team.Bad,
      },
    });
    render(<SecretVillainStartingView gameState={gameState} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.starting.specialBadMessage),
    ).toBeDefined();
  });

  it("shows allies list for Bad player", () => {
    const gameState = makeGameState({
      myPlayerId: "p2",
      myRole: { id: "bad", name: "Bad Role", team: Team.Bad },
      visibleRoleAssignments: [
        {
          player: { id: "p3", name: "Charlie" },
          reason: "wake-partner",
          role: { id: "bad", name: "Bad Role", team: Team.Bad },
        },
        {
          player: { id: "p4", name: "Diana" },
          reason: "wake-partner",
          role: {
            id: "special-bad",
            name: "Special Bad Role",
            team: Team.Bad,
          },
        },
      ],
    });
    render(<SecretVillainStartingView gameState={gameState} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.starting.badTeamHeading),
    ).toBeDefined();
    expect(screen.getByText("Charlie")).toBeDefined();
    expect(screen.getByText("Diana")).toBeDefined();
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.starting.specialBadMarker),
    ).toBeDefined();
  });

  it("shows countdown when secondsRemaining is provided", () => {
    const gameState = makeGameState({
      myPlayerId: "p1",
      myRole: { id: "good", name: "Good Role", team: Team.Good },
    });
    render(
      <SecretVillainStartingView gameState={gameState} secondsRemaining={10} />,
    );
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.starting.gameStartsIn),
    ).toBeDefined();
    expect(screen.getByText("10s")).toBeDefined();
  });

  it("hides countdown when secondsRemaining is not provided", () => {
    const gameState = makeGameState({
      myPlayerId: "p1",
      myRole: { id: "good", name: "Good Role", team: Team.Good },
    });
    const { container } = render(
      <SecretVillainStartingView gameState={gameState} />,
    );
    expect(
      container.textContent.includes(SECRET_VILLAIN_COPY.starting.gameStartsIn),
    ).toBe(false);
  });
});
