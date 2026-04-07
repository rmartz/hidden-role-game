import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GameMode, GameStatus } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import {
  SecretVillainPhase,
  SpecialActionType,
} from "@/lib/game/modes/secret-villain/types";
import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import { BoardScreen } from "./BoardScreen";

afterEach(cleanup);

const players = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Carol" },
  { id: "p4", name: "Dave" },
  { id: "p5", name: "Eve" },
];

const defaultPowerTable = [
  undefined,
  undefined,
  SpecialActionType.InvestigateTeam,
  SpecialActionType.Shoot,
  SpecialActionType.Shoot,
];

function makeGameState(
  overrides?: Partial<SecretVillainPlayerGameState>,
): SecretVillainPlayerGameState {
  return {
    gameMode: GameMode.SecretVillain,
    status: { type: GameStatus.Playing },
    lobbyId: "lobby-1",
    players,
    gameOwner: { id: "board-player", name: "Board" },
    myPlayerId: undefined,
    myRole: undefined,
    visibleRoleAssignments: [],
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    svPhase: {
      type: SecretVillainPhase.ElectionNomination,
      presidentId: "p1",
    },
    svBoard: {
      goodCardsPlayed: 2,
      badCardsPlayed: 1,
      failedElectionCount: 0,
      powerTable: defaultPowerTable,
    },
    deadPlayerIds: [],
    ...overrides,
  };
}

describe("BoardScreen", () => {
  it("renders the board heading", () => {
    render(<BoardScreen gameState={makeGameState()} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.boardScreen.heading),
    ).toBeDefined();
  });

  it("shows the current phase label", () => {
    render(<BoardScreen gameState={makeGameState()} />);
    expect(screen.getByTestId("phase-badge").textContent).toBe(
      SECRET_VILLAIN_COPY.boardScreen.phaseLabels[
        SecretVillainPhase.ElectionNomination
      ],
    );
  });

  it("shows the president name", () => {
    render(<BoardScreen gameState={makeGameState()} />);
    expect(screen.getByTestId("president-name").textContent).toContain("Alice");
  });

  it("shows chancellor nominee name when present", () => {
    const gameState = makeGameState({
      svPhase: {
        type: SecretVillainPhase.ElectionVote,
        presidentId: "p1",
        chancellorNomineeId: "p2",
      },
    });
    render(<BoardScreen gameState={gameState} />);
    expect(screen.getByTestId("chancellor-nominee-name").textContent).toContain(
      "Bob",
    );
  });

  it("shows chancellor name during policy phase", () => {
    const gameState = makeGameState({
      svPhase: {
        type: SecretVillainPhase.PolicyPresident,
        presidentId: "p1",
        chancellorId: "p3",
      },
    });
    render(<BoardScreen gameState={gameState} />);
    expect(screen.getByTestId("chancellor-name").textContent).toContain(
      "Carol",
    );
  });

  it("shows 'None' when no players are eliminated", () => {
    render(<BoardScreen gameState={makeGameState()} />);
    expect(screen.getByTestId("no-eliminated")).toBeDefined();
    expect(screen.getByTestId("no-eliminated").textContent).toBe(
      SECRET_VILLAIN_COPY.boardScreen.noEliminated,
    );
  });

  it("shows eliminated player names", () => {
    const gameState = makeGameState({ deadPlayerIds: ["p4", "p5"] });
    render(<BoardScreen gameState={gameState} />);
    expect(screen.getByTestId("eliminated-player-0").textContent).toBe("Dave");
    expect(screen.getByTestId("eliminated-player-1").textContent).toBe("Eve");
  });

  it("renders without crashing when svBoard is absent", () => {
    render(<BoardScreen gameState={makeGameState({ svBoard: undefined })} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.boardScreen.heading),
    ).toBeDefined();
  });
});
