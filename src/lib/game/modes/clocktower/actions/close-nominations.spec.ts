import { describe, it, expect } from "vitest";
import { closeNominationsAction } from "./close-nominations";
import { makeDayTurnState, makePlayingGame } from "./test-helpers";
import type { ClocktowerDayPhase, ClocktowerTurnState } from "../types";
import { GameStatus } from "@/lib/types";
import type { Game } from "@/lib/types";

function getDayPhase(game: Game): ClocktowerDayPhase {
  return (game.status as { turnState: ClocktowerTurnState }).turnState
    .phase as ClocktowerDayPhase;
}

function getTurnState(game: Game): ClocktowerTurnState {
  return (game.status as { turnState: ClocktowerTurnState }).turnState;
}

describe("closeNominationsAction.isValid", () => {
  it("allows closing nominations during the day phase", () => {
    const ts = makeDayTurnState();
    const game = makePlayingGame(ts);
    expect(closeNominationsAction.isValid(game, "owner", {})).toBe(true);
  });

  it("rejects when game is not in playing state", () => {
    const ts = makeDayTurnState();
    const game = makePlayingGame(ts);
    // @ts-expect-error — override status for test
    game.status = { type: GameStatus.Lobby };
    expect(closeNominationsAction.isValid(game, "owner", {})).toBe(false);
  });

  it("rejects during the night phase", () => {
    const ts = makeDayTurnState();
    // @ts-expect-error — override phase for test
    ts.phase = { type: "night", currentActionIndex: 0, nightActions: {} };
    const game = makePlayingGame(ts);
    expect(closeNominationsAction.isValid(game, "owner", {})).toBe(false);
  });
});

describe("closeNominationsAction.apply — no execution", () => {
  it("does not execute anyone when there are no nominations", () => {
    const ts = makeDayTurnState();
    const game = makePlayingGame(ts);
    closeNominationsAction.apply(game, {}, "owner");
    expect(getDayPhase(game).executedToday).toBeUndefined();
    expect(getTurnState(game).deadPlayerIds).toHaveLength(0);
  });

  it("does not execute when no nomination meets the threshold", () => {
    // 5 alive players → threshold > 2.5, need 3+ yes votes
    const ts = makeDayTurnState(
      {},
      {
        nominations: [
          {
            nominatorId: "p2",
            nomineeId: "p3",
            votes: [
              { playerId: "p2", voted: true },
              { playerId: "p4", voted: true },
              // Only 2 yes votes — does not exceed 2.5
            ],
          },
        ],
      },
    );
    const game = makePlayingGame(ts);
    closeNominationsAction.apply(game, {}, "owner");
    expect(getDayPhase(game).executedToday).toBeUndefined();
  });

  it("does not execute when two nominations tie for the top qualifying count", () => {
    // 5 alive → threshold 2.5, need 3+; both get 3 yes votes → tie
    const ts = makeDayTurnState(
      {},
      {
        nominations: [
          {
            nominatorId: "p2",
            nomineeId: "p3",
            votes: [
              { playerId: "p1", voted: true },
              { playerId: "p2", voted: true },
              { playerId: "p4", voted: true },
            ],
          },
          {
            nominatorId: "p4",
            nomineeId: "p5",
            votes: [
              { playerId: "p1", voted: true },
              { playerId: "p2", voted: true },
              { playerId: "p4", voted: true },
            ],
          },
        ],
      },
    );
    const game = makePlayingGame(ts);
    closeNominationsAction.apply(game, {}, "owner");
    expect(getDayPhase(game).executedToday).toBeUndefined();
  });
});

describe("closeNominationsAction.apply — execution", () => {
  it("executes the nominee when a single nomination meets the threshold", () => {
    // 5 alive → need >2.5 yes votes, so 3+
    const ts = makeDayTurnState(
      {},
      {
        nominations: [
          {
            nominatorId: "p2",
            nomineeId: "p3",
            votes: [
              { playerId: "p1", voted: true },
              { playerId: "p2", voted: true },
              { playerId: "p4", voted: true },
            ],
          },
        ],
      },
    );
    const game = makePlayingGame(ts);
    closeNominationsAction.apply(game, {}, "owner");
    expect(getDayPhase(game).executedToday).toBe("p3");
    expect(getTurnState(game).deadPlayerIds).toContain("p3");
  });

  it("executes the nominee with the highest qualifying vote count", () => {
    // 5 alive → threshold 2.5; p3 gets 3, p5 gets 4 → p5 should be executed
    const ts = makeDayTurnState(
      {},
      {
        nominations: [
          {
            nominatorId: "p2",
            nomineeId: "p3",
            votes: [
              { playerId: "p1", voted: true },
              { playerId: "p2", voted: true },
              { playerId: "p4", voted: true },
            ],
          },
          {
            nominatorId: "p4",
            nomineeId: "p5",
            votes: [
              { playerId: "p1", voted: true },
              { playerId: "p2", voted: true },
              { playerId: "p3", voted: true },
              { playerId: "p4", voted: true },
            ],
          },
        ],
      },
    );
    const game = makePlayingGame(ts);
    closeNominationsAction.apply(game, {}, "owner");
    expect(getDayPhase(game).executedToday).toBe("p5");
    expect(getTurnState(game).deadPlayerIds).toContain("p5");
  });

  it("does not add nominee to deadPlayerIds twice if already dead", () => {
    const ts = makeDayTurnState(
      { deadPlayerIds: ["p3"] },
      {
        nominations: [
          {
            nominatorId: "p2",
            nomineeId: "p3",
            votes: [
              { playerId: "p1", voted: true },
              { playerId: "p2", voted: true },
              { playerId: "p4", voted: true },
            ],
          },
        ],
      },
    );
    const game = makePlayingGame(ts);
    closeNominationsAction.apply(game, {}, "owner");
    expect(
      getTurnState(game).deadPlayerIds.filter((id) => id === "p3"),
    ).toHaveLength(1);
  });
});
