import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SecretVillainGameOverView } from "./SecretVillainGameOverView";
import { SecretVillainWinner } from "@/lib/game/modes/secret-villain/utils/win-condition";
import { GameStatus, GameMode, Team } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import { SvTheme, SV_THEMES } from "@/lib/game/modes/secret-villain/themes";
import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";

afterEach(cleanup);

function makeGameState(
  overrides: Partial<SecretVillainPlayerGameState> = {},
): SecretVillainPlayerGameState {
  return {
    status: { type: GameStatus.Finished, winner: SecretVillainWinner.Good },
    gameMode: GameMode.SecretVillain,
    lobbyId: "lobby-1",
    players: [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
    ],
    visibleRoleAssignments: [
      {
        player: { id: "p1", name: "Alice" },
        reason: "revealed" as const,
        role: { id: "good", name: "Good Role", team: Team.Good },
      },
      {
        player: { id: "p2", name: "Bob" },
        reason: "revealed" as const,
        role: { id: "bad", name: "Bad Role", team: Team.Bad },
      },
    ],
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    ...overrides,
  };
}

const defaultProps = {
  onReturnToLobby: vi.fn(),
};

describe("SecretVillainGameOverView", () => {
  it("shows victory for Good team player when Good wins", () => {
    const gameState = makeGameState({
      myRole: { id: "good", name: "Good Role", team: Team.Good },
      myPlayerId: "p1",
    });
    render(
      <SecretVillainGameOverView {...defaultProps} gameState={gameState} />,
    );
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.gameOver.victory),
    ).toBeDefined();
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.gameOver.goodWins),
    ).toBeDefined();
  });

  it("shows defeat for Good team player when Bad wins", () => {
    const gameState = makeGameState({
      status: { type: GameStatus.Finished, winner: SecretVillainWinner.Bad },
      myRole: { id: "good", name: "Good Role", team: Team.Good },
      myPlayerId: "p1",
    });
    render(
      <SecretVillainGameOverView {...defaultProps} gameState={gameState} />,
    );
    expect(screen.getByText(SECRET_VILLAIN_COPY.gameOver.defeat)).toBeDefined();
  });

  it("shows error message when returnError is true", () => {
    const gameState = makeGameState();
    render(
      <SecretVillainGameOverView
        {...defaultProps}
        gameState={gameState}
        returnError={true}
      />,
    );
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.gameOver.returnToLobbyError),
    ).toBeDefined();
  });

  it("renders role assignment list with player names", () => {
    const gameState = makeGameState();
    render(
      <SecretVillainGameOverView {...defaultProps} gameState={gameState} />,
    );
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
  });

  it("renders victory condition label when victoryCondition is set", () => {
    const label = "Good policy victory";
    const gameState = makeGameState({
      victoryCondition: { label, winner: Team.Good },
    });
    render(
      <SecretVillainGameOverView {...defaultProps} gameState={gameState} />,
    );
    expect(screen.getByText(label)).toBeDefined();
  });

  it("does not render victory condition label when victoryCondition is absent", () => {
    const label = "Good policy victory";
    const gameState = makeGameState();
    render(
      <SecretVillainGameOverView {...defaultProps} gameState={gameState} />,
    );
    expect(screen.queryByText(label)).toBeNull();
  });

  it("renders themed role names for the Original theme", () => {
    const theme = SvTheme.Original;
    const themeLabels = SV_THEMES[theme];
    const gameState = makeGameState({
      svTheme: theme,
      visibleRoleAssignments: [
        {
          player: { id: "p1", name: "Alice" },
          reason: "revealed" as const,
          role: { id: "good", name: "Good Role", team: Team.Good },
        },
        {
          player: { id: "p2", name: "Bob" },
          reason: "revealed" as const,
          role: { id: "bad", name: "Bad Role", team: Team.Bad },
        },
        {
          player: { id: "p3", name: "Charlie" },
          reason: "revealed" as const,
          role: { id: "special-bad", name: "Special Bad Role", team: Team.Bad },
        },
      ],
    });
    render(
      <SecretVillainGameOverView {...defaultProps} gameState={gameState} />,
    );
    expect(screen.getByText(themeLabels.goodRole)).toBeDefined();
    expect(screen.getByText(themeLabels.badRole)).toBeDefined();
    expect(screen.getByText(themeLabels.specialBadRole)).toBeDefined();
  });

  it("renders themed role names for the Star Wars theme", () => {
    const theme = SvTheme.StarWars;
    const themeLabels = SV_THEMES[theme];
    const gameState = makeGameState({
      svTheme: theme,
      visibleRoleAssignments: [
        {
          player: { id: "p1", name: "Alice" },
          reason: "revealed" as const,
          role: { id: "good", name: "Good Role", team: Team.Good },
        },
        {
          player: { id: "p2", name: "Bob" },
          reason: "revealed" as const,
          role: { id: "special-bad", name: "Special Bad Role", team: Team.Bad },
        },
      ],
    });
    render(
      <SecretVillainGameOverView {...defaultProps} gameState={gameState} />,
    );
    expect(screen.getByText(themeLabels.goodRole)).toBeDefined();
    expect(screen.getByText(themeLabels.specialBadRole)).toBeDefined();
  });
});
