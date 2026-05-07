import { describe, it, expect } from "vitest";
import { WerewolfPhase, TrialPhase } from "../types";
import type {
  WerewolfNighttimePhase,
  WerewolfDaytimePhase,
  WerewolfTurnState,
  ActiveTrial,
} from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame } from "./test-helpers";

const pauseTimer = WEREWOLF_ACTIONS[WerewolfAction.PauseTimer];
const resumeTimer = WEREWOLF_ACTIONS[WerewolfAction.ResumeTimer];

function makeNightTurnState(
  overrides: Partial<WerewolfNighttimePhase> = {},
): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
      currentPhaseIndex: 0,
      nightActions: {},
      ...overrides,
    },
    deadPlayerIds: [],
  };
}

function makeDayTurnState(
  overrides: Partial<WerewolfDaytimePhase> = {},
): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      ...overrides,
    },
    deadPlayerIds: [],
  };
}

function makeActiveTrial(overrides: Partial<ActiveTrial> = {}): ActiveTrial {
  return {
    defendantId: "p2",
    startedAt: 1000,
    phase: TrialPhase.Defense,
    votes: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// PauseTimer
// ---------------------------------------------------------------------------

describe("WerewolfAction.PauseTimer", () => {
  describe("isValid", () => {
    it("returns true during nighttime when called by the owner", () => {
      const game = makePlayingGame(makeNightTurnState());
      expect(pauseTimer.isValid(game, "owner-1", null)).toBe(true);
    });

    it("returns true during daytime when called by the owner", () => {
      const game = makePlayingGame(makeDayTurnState());
      expect(pauseTimer.isValid(game, "owner-1", null)).toBe(true);
    });

    it("returns false when called by a non-owner", () => {
      const game = makePlayingGame(makeNightTurnState());
      expect(pauseTimer.isValid(game, "p1", null)).toBe(false);
    });

    it("returns false when the timer is already paused", () => {
      const game = makePlayingGame(makeNightTurnState({ pausedAt: 5000 }));
      expect(pauseTimer.isValid(game, "owner-1", null)).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets pausedAt to a recent timestamp during nighttime", () => {
      const before = Date.now();
      const game = makePlayingGame(makeNightTurnState());
      pauseTimer.apply(game, null, "owner-1");
      const after = Date.now();
      const phase = (
        game.status as { turnState: { phase: WerewolfNighttimePhase } }
      ).turnState.phase;
      expect(phase.pausedAt).toBeGreaterThanOrEqual(before);
      expect(phase.pausedAt).toBeLessThanOrEqual(after);
    });

    it("sets pausedAt to a recent timestamp during daytime", () => {
      const before = Date.now();
      const game = makePlayingGame(makeDayTurnState());
      pauseTimer.apply(game, null, "owner-1");
      const after = Date.now();
      const phase = (
        game.status as { turnState: { phase: WerewolfDaytimePhase } }
      ).turnState.phase;
      expect(phase.pausedAt).toBeGreaterThanOrEqual(before);
      expect(phase.pausedAt).toBeLessThanOrEqual(after);
    });
  });
});

// ---------------------------------------------------------------------------
// ResumeTimer
// ---------------------------------------------------------------------------

describe("WerewolfAction.ResumeTimer", () => {
  describe("isValid", () => {
    it("returns false when the timer is not paused", () => {
      const game = makePlayingGame(makeNightTurnState());
      expect(resumeTimer.isValid(game, "owner-1", null)).toBe(false);
    });

    it("returns true when the timer is paused and called by the owner", () => {
      const game = makePlayingGame(makeNightTurnState({ pausedAt: 5000 }));
      expect(resumeTimer.isValid(game, "owner-1", null)).toBe(true);
    });

    it("returns false when called by a non-owner even if paused", () => {
      const game = makePlayingGame(makeNightTurnState({ pausedAt: 5000 }));
      expect(resumeTimer.isValid(game, "p1", null)).toBe(false);
    });
  });

  describe("apply", () => {
    it("clears pausedAt after resuming", () => {
      const game = makePlayingGame(makeNightTurnState({ pausedAt: 5000 }));
      resumeTimer.apply(game, null, "owner-1");
      const phase = (
        game.status as { turnState: { phase: WerewolfNighttimePhase } }
      ).turnState.phase;
      expect(phase.pausedAt).toBeUndefined();
    });

    it("clears pausedAt after resuming during daytime", () => {
      const game = makePlayingGame(makeDayTurnState({ pausedAt: 5000 }));
      resumeTimer.apply(game, null, "owner-1");
      const phase = (
        game.status as { turnState: { phase: WerewolfDaytimePhase } }
      ).turnState.phase;
      expect(phase.pausedAt).toBeUndefined();
    });

    it("accumulates elapsed time into pauseOffset and resets startedAt", () => {
      // Phase started at 1000ms, paused at 3000ms — 2000ms elapsed.
      const game = makePlayingGame(
        makeNightTurnState({ startedAt: 1000, pausedAt: 3000 }),
      );
      const before = Date.now();
      resumeTimer.apply(game, null, "owner-1");
      const after = Date.now();
      const phase = (
        game.status as { turnState: { phase: WerewolfNighttimePhase } }
      ).turnState.phase;
      // pauseOffset should be pausedAt - startedAt = 3000 - 1000 = 2000
      expect(phase.pauseOffset).toBe(2000);
      // startedAt is reset to now so elapsed continues from 2000ms
      expect(phase.startedAt).toBeGreaterThanOrEqual(before);
      expect(phase.startedAt).toBeLessThanOrEqual(after);
    });

    it("adds to existing pauseOffset on successive pause/resume cycles", () => {
      // Already accumulated 1500ms, then paused again 2000ms after startedAt.
      const game = makePlayingGame(
        makeNightTurnState({
          startedAt: 1000,
          pausedAt: 3000,
          pauseOffset: 1500,
        }),
      );
      resumeTimer.apply(game, null, "owner-1");
      const phase = (
        game.status as { turnState: { phase: WerewolfNighttimePhase } }
      ).turnState.phase;
      // New pauseOffset = 1500 + (3000 - 1000) = 3500
      expect(phase.pauseOffset).toBe(3500);
    });
  });
});

// ---------------------------------------------------------------------------
// Pause/Resume round-trip: elapsed time is preserved
// ---------------------------------------------------------------------------

describe("PauseTimer / ResumeTimer round-trip", () => {
  it("preserves the elapsed value across a pause and resume cycle", () => {
    const startedAt = Date.now() - 10_000; // started 10s ago
    const game = makePlayingGame(makeNightTurnState({ startedAt }));

    // Pause immediately
    pauseTimer.apply(game, null, "owner-1");
    const phase = (
      game.status as { turnState: { phase: WerewolfNighttimePhase } }
    ).turnState.phase;
    const pausedAtMs = phase.pausedAt!;
    const elapsedBeforePause = pausedAtMs - startedAt;

    // Resume
    resumeTimer.apply(game, null, "owner-1");
    const phaseAfter = (
      game.status as { turnState: { phase: WerewolfNighttimePhase } }
    ).turnState.phase;

    // After resume: elapsed = pauseOffset + (now - newStartedAt)
    // At the instant of resume, (now - newStartedAt) ≈ 0, so elapsed ≈ pauseOffset
    expect(phaseAfter.pauseOffset).toBe(elapsedBeforePause);
    expect(phaseAfter.pausedAt).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Active trial timer: PauseTimer / ResumeTimer target activeTrial
// ---------------------------------------------------------------------------

describe("WerewolfAction.PauseTimer — active trial", () => {
  describe("isValid", () => {
    it("returns true when a trial is active and not yet paused", () => {
      const game = makePlayingGame(
        makeDayTurnState({ activeTrial: makeActiveTrial() }),
      );
      expect(pauseTimer.isValid(game, "owner-1", null)).toBe(true);
    });

    it("returns false when the trial timer is already paused", () => {
      const game = makePlayingGame(
        makeDayTurnState({ activeTrial: makeActiveTrial({ pausedAt: 5000 }) }),
      );
      expect(pauseTimer.isValid(game, "owner-1", null)).toBe(false);
    });

    it("returns false when called by a non-owner during an active trial", () => {
      const game = makePlayingGame(
        makeDayTurnState({ activeTrial: makeActiveTrial() }),
      );
      expect(pauseTimer.isValid(game, "p1", null)).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets pausedAt on activeTrial, not on the phase", () => {
      const before = Date.now();
      const game = makePlayingGame(
        makeDayTurnState({ activeTrial: makeActiveTrial() }),
      );
      pauseTimer.apply(game, null, "owner-1");
      const after = Date.now();
      const phase = (
        game.status as { turnState: { phase: WerewolfDaytimePhase } }
      ).turnState.phase;
      expect(phase.pausedAt).toBeUndefined();
      expect(phase.activeTrial?.pausedAt).toBeGreaterThanOrEqual(before);
      expect(phase.activeTrial?.pausedAt).toBeLessThanOrEqual(after);
    });
  });
});

describe("WerewolfAction.ResumeTimer — active trial (defense phase)", () => {
  describe("isValid", () => {
    it("returns true when the trial timer is paused and called by the owner", () => {
      const game = makePlayingGame(
        makeDayTurnState({ activeTrial: makeActiveTrial({ pausedAt: 5000 }) }),
      );
      expect(resumeTimer.isValid(game, "owner-1", null)).toBe(true);
    });

    it("returns false when the trial timer is not paused", () => {
      const game = makePlayingGame(
        makeDayTurnState({ activeTrial: makeActiveTrial() }),
      );
      expect(resumeTimer.isValid(game, "owner-1", null)).toBe(false);
    });
  });

  describe("apply", () => {
    it("clears pausedAt on the trial and shifts startedAt forward", () => {
      // Trial started at 1000ms, paused at 3000ms — 2000ms elapsed on defense timer.
      const game = makePlayingGame(
        makeDayTurnState({
          activeTrial: makeActiveTrial({ startedAt: 1000, pausedAt: 3000 }),
        }),
      );
      const before = Date.now();
      resumeTimer.apply(game, null, "owner-1");
      const after = Date.now();
      const phase = (
        game.status as { turnState: { phase: WerewolfDaytimePhase } }
      ).turnState.phase;
      expect(phase.activeTrial?.pausedAt).toBeUndefined();
      expect(phase.activeTrial?.pauseOffset).toBe(2000);
      expect(phase.activeTrial?.startedAt).toBeGreaterThanOrEqual(before);
      expect(phase.activeTrial?.startedAt).toBeLessThanOrEqual(after);
    });
  });
});

describe("WerewolfAction.ResumeTimer — active trial (voting phase)", () => {
  describe("apply", () => {
    it("clears pausedAt and shifts voteStartedAt forward, leaving startedAt unchanged", () => {
      // Vote started at 5000ms, paused at 7000ms — 2000ms elapsed on vote timer.
      const game = makePlayingGame(
        makeDayTurnState({
          activeTrial: makeActiveTrial({
            phase: TrialPhase.Voting,
            startedAt: 1000,
            voteStartedAt: 5000,
            pausedAt: 7000,
          }),
        }),
      );
      const originalStartedAt = 1000;
      const before = Date.now();
      resumeTimer.apply(game, null, "owner-1");
      const after = Date.now();
      const phase = (
        game.status as { turnState: { phase: WerewolfDaytimePhase } }
      ).turnState.phase;
      expect(phase.activeTrial?.pausedAt).toBeUndefined();
      expect(phase.activeTrial?.pauseOffset).toBe(2000);
      expect(phase.activeTrial?.voteStartedAt).toBeGreaterThanOrEqual(before);
      expect(phase.activeTrial?.voteStartedAt).toBeLessThanOrEqual(after);
      // startedAt (defense timer base) must not be modified
      expect(phase.activeTrial?.startedAt).toBe(originalStartedAt);
    });
  });
});
