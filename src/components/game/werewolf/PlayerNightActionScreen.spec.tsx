import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { GameMode, GameStatus, Team } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";
import {
  WerewolfPhase,
  type WerewolfNighttimePhase,
} from "@/lib/game/modes/werewolf";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { PlayerNightActionScreen } from "./PlayerNightActionScreen";
import type { PlayerTargetSelectionProps } from "./PlayerTargetSelection";

const { playerTargetSelectionMock } = vi.hoisted(() => ({
  playerTargetSelectionMock: vi.fn(),
}));

vi.mock("@/components/game", () => ({
  GameTimer: () => <div>timer</div>,
}));

vi.mock("./AltruistActionPanel", () => ({
  AltruistActionPanel: () => <div>altruist</div>,
}));

vi.mock("./ConfirmTargetButton", () => ({
  ConfirmTargetButton: () => <button type="button">confirm</button>,
}));

vi.mock("./PlayerFirstTurnScreen", () => ({
  PlayerFirstTurnScreen: () => <div>first-turn</div>,
}));

vi.mock("./PlayerInvestigationResult", () => ({
  PlayerInvestigationResult: () => <div>investigation-result</div>,
}));

vi.mock("./PlayerTargetSelection", () => ({
  PlayerTargetSelection: (props: unknown) => {
    playerTargetSelectionMock(props);
    return <div>target-selection</div>;
  },
}));

afterEach(() => {
  cleanup();
  playerTargetSelectionMock.mockReset();
});

describe("PlayerNightActionScreen", () => {
  it("keeps both Mentalist selected targets visible after confirmation", () => {
    const gameState: WerewolfPlayerGameState = {
      gameMode: GameMode.Werewolf,
      status: { type: GameStatus.Playing },
      lobbyId: "lobby-1",
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
        { id: "p3", name: "Charlie" },
      ],
      visibleRoleAssignments: [],
      timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
      nominationsEnabled: true,
      trialsPerDay: 1,
      revealProtections: true,
      autoRevealNightOutcome: true,
      myPlayerId: "p1",
      myRole: {
        id: WerewolfRole.Mentalist,
        name: "Mentalist",
        team: Team.Good,
      },
      myNightTarget: "p2",
      mySecondNightTarget: "p3",
      myNightTargetConfirmed: true,
    };

    const phase: WerewolfNighttimePhase = {
      type: WerewolfPhase.Nighttime,
      startedAt: Date.now(),
      nightPhaseOrder: [WerewolfRole.Mentalist],
      currentPhaseIndex: 0,
      nightActions: {},
    };

    render(
      <PlayerNightActionScreen
        gameId="game-1"
        gameState={gameState}
        phase={phase}
        turn={2}
        deadPlayerIds={[]}
      />,
    );

    const firstCall = playerTargetSelectionMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (firstCall === undefined) return;
    const props = firstCall[0] as PlayerTargetSelectionProps;
    const targetIds = props.targets.map(([player]) => player.id);

    expect(targetIds).toEqual(["p2", "p3"]);
  });

  it("keeps only the selected target visible for confirmed non-Mentalist roles", () => {
    const gameState: WerewolfPlayerGameState = {
      gameMode: GameMode.Werewolf,
      status: { type: GameStatus.Playing },
      lobbyId: "lobby-1",
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
        { id: "p3", name: "Charlie" },
      ],
      visibleRoleAssignments: [],
      timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
      nominationsEnabled: true,
      trialsPerDay: 1,
      revealProtections: true,
      autoRevealNightOutcome: true,
      myPlayerId: "p1",
      myRole: {
        id: WerewolfRole.Seer,
        name: "Seer",
        team: Team.Good,
      },
      myNightTarget: "p2",
      mySecondNightTarget: "p3",
      myNightTargetConfirmed: true,
    };

    const phase: WerewolfNighttimePhase = {
      type: WerewolfPhase.Nighttime,
      startedAt: Date.now(),
      nightPhaseOrder: [WerewolfRole.Seer],
      currentPhaseIndex: 0,
      nightActions: {},
    };

    render(
      <PlayerNightActionScreen
        gameId="game-1"
        gameState={gameState}
        phase={phase}
        turn={2}
        deadPlayerIds={[]}
      />,
    );

    const firstCall = playerTargetSelectionMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (firstCall === undefined) return;
    const props = firstCall[0] as PlayerTargetSelectionProps;
    const targetIds = props.targets.map(([player]) => player.id);

    expect(targetIds).toEqual(["p2"]);
  });
});
