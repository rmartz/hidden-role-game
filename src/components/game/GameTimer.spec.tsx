import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { GameTimer } from "./GameTimer";
import { GAME_TIMER_COPY } from "./GameTimer.copy";

afterEach(cleanup);

const BASE_NOW = 1_000_000_000_000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(BASE_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GameTimer", () => {
  it("renders the time remaining label in normal (unpaused) state", () => {
    render(
      <GameTimer
        durationSeconds={300}
        autoAdvance={false}
        startedAt={new Date(BASE_NOW)}
      />,
    );

    expect(
      screen.getByText(GAME_TIMER_COPY.timeRemaining, { exact: false }),
    ).toBeDefined();
  });

  it("renders the paused label when pausedAt is provided", () => {
    const startedAt = new Date(BASE_NOW - 60_000);
    const pausedAt = new Date(BASE_NOW - 30_000);

    render(
      <GameTimer
        durationSeconds={300}
        autoAdvance={false}
        startedAt={startedAt}
        pausedAt={pausedAt}
      />,
    );

    expect(
      screen.getByText(GAME_TIMER_COPY.paused, { exact: false }),
    ).toBeDefined();
  });

  it("does not render the time remaining label when paused", () => {
    const startedAt = new Date(BASE_NOW - 60_000);
    const pausedAt = new Date(BASE_NOW - 30_000);

    render(
      <GameTimer
        durationSeconds={300}
        autoAdvance={false}
        startedAt={startedAt}
        pausedAt={pausedAt}
      />,
    );

    expect(
      screen.queryByText(GAME_TIMER_COPY.timeRemaining, { exact: false }),
    ).toBeNull();
  });

  it("displays the frozen time at pausedAt, not the current time", () => {
    // Phase started 60s ago; paused 30s ago → elapsed at pause = 30s → remaining = 270s
    const startedAt = new Date(BASE_NOW - 60_000);
    const pausedAt = new Date(BASE_NOW - 30_000);

    render(
      <GameTimer
        durationSeconds={300}
        autoAdvance={false}
        startedAt={startedAt}
        pausedAt={pausedAt}
      />,
    );

    // 300 - 30 = 270 seconds remaining, formatted as "04:30"
    expect(screen.getByText(/04:30/)).toBeDefined();
  });

  it("incorporates pauseOffset into the frozen elapsed time", () => {
    // Phase started 60s ago; paused 30s ago; 20s already accumulated in offset.
    // elapsed at pause = pauseOffset (20s) + (pausedAt - startedAt) (30s) = 50s
    // remaining = 300 - 50 = 250s = "04:10"
    const startedAt = new Date(BASE_NOW - 60_000);
    const pausedAt = new Date(BASE_NOW - 30_000);

    render(
      <GameTimer
        durationSeconds={300}
        autoAdvance={false}
        startedAt={startedAt}
        pausedAt={pausedAt}
        pauseOffset={20_000}
      />,
    );

    expect(screen.getByText(/04:10/)).toBeDefined();
  });

  it("renders overtime text when the timer has expired", () => {
    render(
      <GameTimer
        durationSeconds={60}
        autoAdvance={false}
        startedAt={new Date(BASE_NOW - 120_000)}
      />,
    );

    expect(
      screen.getByText(GAME_TIMER_COPY.overtime, { exact: false }),
    ).toBeDefined();
  });

  it("renders advancing text when autoAdvance is true and timer has expired", () => {
    render(
      <GameTimer
        durationSeconds={60}
        autoAdvance={true}
        startedAt={new Date(BASE_NOW - 120_000)}
      />,
    );

    expect(screen.getByText(GAME_TIMER_COPY.advancing)).toBeDefined();
  });

  it("does not re-fire onTimerTrigger when pausing and resuming an expired timer", () => {
    const onTimerTrigger = vi.fn();
    const startedAt = new Date(BASE_NOW - 120_000);

    const { rerender } = render(
      <GameTimer
        durationSeconds={60}
        autoAdvance={false}
        startedAt={startedAt}
        onTimerTrigger={onTimerTrigger}
      />,
    );

    // Timer is expired on mount; tick() fires immediately inside the effect.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onTimerTrigger).toHaveBeenCalledTimes(1);

    // Pause the timer — should not reset hasTriggeredRef.
    rerender(
      <GameTimer
        durationSeconds={60}
        autoAdvance={false}
        startedAt={startedAt}
        onTimerTrigger={onTimerTrigger}
        pausedAt={new Date(BASE_NOW)}
      />,
    );

    // Resume — should not fire again.
    rerender(
      <GameTimer
        durationSeconds={60}
        autoAdvance={false}
        startedAt={startedAt}
        onTimerTrigger={onTimerTrigger}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onTimerTrigger).toHaveBeenCalledTimes(1);
  });
});
