import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GameOverScreenView } from "./GameOverScreenView";
import { WerewolfWinner } from "@/lib/game-modes/werewolf/utils/win-condition";
import { GameStatus, GameMode, Team } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game-modes/werewolf/timer-config";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";
import type { WerewolfPlayerGameState } from "@/lib/game-modes/werewolf/player-state";

afterEach(cleanup);

function makeGameState(
  overrides: Partial<WerewolfPlayerGameState> = {},
): WerewolfPlayerGameState {
  return {
    status: { type: GameStatus.Finished, winner: WerewolfWinner.Village },
    gameMode: GameMode.Werewolf,
    lobbyId: "lobby-1",
    players: [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
    ],
    visibleRoleAssignments: [
      {
        player: { id: "p1", name: "Alice" },
        reason: "revealed" as const,
        role: { id: "villager", name: "Villager", team: Team.Good },
      },
      {
        player: { id: "p2", name: "Bob" },
        reason: "revealed" as const,
        role: { id: "werewolf", name: "Werewolf", team: Team.Bad },
      },
    ],
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    nominationsEnabled: false,
    singleTrialPerDay: false,
    revealProtections: false,
    ...overrides,
  };
}

const defaultProps = {
  onReturnToLobby: vi.fn(),
};

describe("GameOverScreenView", () => {
  it("shows victory heading for Good team player when Village wins", () => {
    const gameState = makeGameState({
      myRole: { id: "villager", name: "Villager", team: Team.Good },
      myPlayerId: "p1",
    });
    render(<GameOverScreenView {...defaultProps} gameState={gameState} />);
    expect(screen.getByText(WEREWOLF_COPY.gameOver.victory)).toBeDefined();
  });

  it("shows defeat heading for Good team player when Werewolves win", () => {
    const gameState = makeGameState({
      status: { type: GameStatus.Finished, winner: WerewolfWinner.Werewolves },
      myRole: { id: "villager", name: "Villager", team: Team.Good },
      myPlayerId: "p1",
    });
    render(<GameOverScreenView {...defaultProps} gameState={gameState} />);
    expect(screen.getByText(WEREWOLF_COPY.gameOver.defeat)).toBeDefined();
  });

  it("shows winner label for narrator (no myRole)", () => {
    const gameState = makeGameState({
      myRole: undefined,
      myPlayerId: undefined,
    });
    render(<GameOverScreenView {...defaultProps} gameState={gameState} />);
    expect(
      screen.getByText(
        WEREWOLF_COPY.gameOver.winnerLabel(WerewolfWinner.Village),
      ),
    ).toBeDefined();
  });

  it("shows draw heading when winner is Draw", () => {
    const gameState = makeGameState({
      status: { type: GameStatus.Finished, winner: WerewolfWinner.Draw },
      myRole: { id: "villager", name: "Villager", team: Team.Good },
      myPlayerId: "p1",
    });
    render(<GameOverScreenView {...defaultProps} gameState={gameState} />);
    expect(screen.getByText(WEREWOLF_COPY.gameOver.draw)).toBeDefined();
  });

  it("shows return-to-lobby error message when returnError is true", () => {
    const gameState = makeGameState();
    render(
      <GameOverScreenView
        {...defaultProps}
        gameState={gameState}
        returnError={true}
      />,
    );
    expect(
      screen.getByText(WEREWOLF_COPY.gameOver.returnToLobbyError),
    ).toBeDefined();
  });

  it("renders role assignment list with player names", () => {
    const gameState = makeGameState();
    render(<GameOverScreenView {...defaultProps} gameState={gameState} />);
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("Villager")).toBeDefined();
    expect(screen.getByText("Werewolf")).toBeDefined();
  });
});
