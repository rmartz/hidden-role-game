import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GameMode, GameStatus } from "@/lib/types";
import { WerewolfPhase } from "@/lib/game/modes/werewolf";
import type { WerewolfNighttimePhase } from "@/lib/game/modes/werewolf";
import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { GhostNightObserverScreen } from "./GhostNightObserverScreen";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

afterEach(cleanup);

const players = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
];

const baseGameState: WerewolfPlayerGameState = {
  gameMode: GameMode.Werewolf,
  status: { type: GameStatus.Playing },
  lobbyId: "lobby-1",
  players,
  visibleRoleAssignments: [],
  timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  nominationsEnabled: false,
  trialsPerDay: 1,
  revealProtections: true,
  autoRevealNightOutcome: true,
  ghostVisible: true,
  amDead: true,
};

describe("GhostNightObserverScreen", () => {
  it("renders the night observer heading", () => {
    const phase: WerewolfNighttimePhase = {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
      currentPhaseIndex: 0,
      nightActions: {},
    };

    render(
      <GhostNightObserverScreen gameState={baseGameState} phase={phase} />,
    );

    expect(
      screen.getByText(WEREWOLF_COPY.ghost.nightObserverHeading),
    ).toBeDefined();
  });

  it("renders the active phase label", () => {
    const phase: WerewolfNighttimePhase = {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
      currentPhaseIndex: 0,
      nightActions: {},
    };

    render(
      <GhostNightObserverScreen gameState={baseGameState} phase={phase} />,
    );

    const heading = screen.getByText(WEREWOLF_COPY.narrator.currentlyAwake, {
      exact: false,
    });
    expect(heading.textContent).toContain("Werewolf");
  });

  it("does not render completed phase list when no phases are completed", () => {
    const phase: WerewolfNighttimePhase = {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
      currentPhaseIndex: 0,
      nightActions: {},
    };

    const { container } = render(
      <GhostNightObserverScreen gameState={baseGameState} phase={phase} />,
    );

    expect(container.querySelector("ul")).toBeNull();
  });

  it("renders completed phases with target player names", () => {
    const phase: WerewolfNighttimePhase = {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
      currentPhaseIndex: 1,
      nightActions: {
        [WerewolfRole.Werewolf]: {
          votes: [{ playerId: "p1", targetPlayerId: "p3" }],
          suggestedTargetId: "p3",
          confirmed: true,
        },
      },
    };

    render(
      <GhostNightObserverScreen gameState={baseGameState} phase={phase} />,
    );

    expect(screen.getByText(/Charlie/)).toBeDefined();
  });

  it("renders skipped phases with the skipped label", () => {
    const phase: WerewolfNighttimePhase = {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
      currentPhaseIndex: 1,
      nightActions: {
        [WerewolfRole.Seer]: {
          skipped: true,
          confirmed: true,
        },
      },
    };

    render(
      <GhostNightObserverScreen gameState={baseGameState} phase={phase} />,
    );

    expect(screen.getByText(/skipped/)).toBeDefined();
  });
});
