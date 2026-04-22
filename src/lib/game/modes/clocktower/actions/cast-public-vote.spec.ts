import { describe, it, expect } from "vitest";
import { castPublicVoteAction } from "./cast-public-vote";
import { makeDayTurnState, makePlayingGame } from "./test-helpers";
import { ClocktowerRole } from "../roles";
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

function makeGameWithNomination(
  nomineeId = "p3",
  overrides: Parameters<typeof makeDayTurnState>[0] = {},
) {
  const ts = makeDayTurnState(overrides, {
    nominations: [{ nominatorId: "p2", nomineeId, votes: [] }],
  });
  return { game: makePlayingGame(ts), ts };
}

describe("castPublicVoteAction.isValid", () => {
  it("allows a living player to vote yes on an open nomination", () => {
    const { game } = makeGameWithNomination();
    expect(
      castPublicVoteAction.isValid(game, "p4", {
        nomineeId: "p3",
        voted: true,
      }),
    ).toBe(true);
  });

  it("allows a living player to vote no on an open nomination", () => {
    const { game } = makeGameWithNomination();
    expect(
      castPublicVoteAction.isValid(game, "p4", {
        nomineeId: "p3",
        voted: false,
      }),
    ).toBe(true);
  });

  it("rejects when game is not in playing state", () => {
    const { game } = makeGameWithNomination();
    // @ts-expect-error — override status for test
    game.status = { type: GameStatus.Lobby };
    expect(
      castPublicVoteAction.isValid(game, "p4", {
        nomineeId: "p3",
        voted: true,
      }),
    ).toBe(false);
  });

  it("rejects when an execution already occurred today", () => {
    const { game } = makeGameWithNomination();
    getDayPhase(game).executedToday = "p3";
    expect(
      castPublicVoteAction.isValid(game, "p4", {
        nomineeId: "p3",
        voted: true,
      }),
    ).toBe(false);
  });

  it("rejects when nominee has no open nomination", () => {
    const { game } = makeGameWithNomination();
    expect(
      castPublicVoteAction.isValid(game, "p4", {
        nomineeId: "p9",
        voted: true,
      }),
    ).toBe(false);
  });

  it("rejects when nomineeId is not a string", () => {
    const { game } = makeGameWithNomination();
    expect(
      castPublicVoteAction.isValid(game, "p4", { nomineeId: 99, voted: true }),
    ).toBe(false);
  });

  it("rejects when voted is not a boolean", () => {
    const { game } = makeGameWithNomination();
    expect(
      castPublicVoteAction.isValid(game, "p4", {
        nomineeId: "p3",
        voted: "yes",
      }),
    ).toBe(false);
  });

  it("allows a dead player to use their ghost vote (yes only)", () => {
    const { game } = makeGameWithNomination("p3", {
      deadPlayerIds: ["p4"],
    });
    expect(
      castPublicVoteAction.isValid(game, "p4", {
        nomineeId: "p3",
        voted: true,
      }),
    ).toBe(true);
  });

  it("rejects a dead player voting no", () => {
    const { game } = makeGameWithNomination("p3", {
      deadPlayerIds: ["p4"],
    });
    expect(
      castPublicVoteAction.isValid(game, "p4", {
        nomineeId: "p3",
        voted: false,
      }),
    ).toBe(false);
  });

  it("rejects a dead player who has already used their ghost vote", () => {
    const { game } = makeGameWithNomination("p3", {
      deadPlayerIds: ["p4"],
      ghostVotesUsed: ["p4"],
    });
    expect(
      castPublicVoteAction.isValid(game, "p4", {
        nomineeId: "p3",
        voted: true,
      }),
    ).toBe(false);
  });

  it("rejects Butler voting yes before their master has voted yes", () => {
    const ts = makeDayTurnState(
      { butlerMasterId: "p4" },
      {
        nominations: [
          {
            nominatorId: "p1",
            nomineeId: "p3",
            votes: [{ playerId: "p4", voted: false }],
          },
        ],
      },
    );
    const game = makePlayingGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: ClocktowerRole.Imp },
        { playerId: "p2", roleDefinitionId: ClocktowerRole.Butler },
        { playerId: "p3", roleDefinitionId: ClocktowerRole.Chef },
        { playerId: "p4", roleDefinitionId: ClocktowerRole.Empath },
        { playerId: "p5", roleDefinitionId: ClocktowerRole.Soldier },
      ],
    });
    expect(
      castPublicVoteAction.isValid(game, "p2", {
        nomineeId: "p3",
        voted: true,
      }),
    ).toBe(false);
  });

  it("allows Butler to vote yes after their master has voted yes", () => {
    const ts = makeDayTurnState(
      { butlerMasterId: "p4" },
      {
        nominations: [
          {
            nominatorId: "p1",
            nomineeId: "p3",
            votes: [{ playerId: "p4", voted: true }],
          },
        ],
      },
    );
    const game = makePlayingGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: ClocktowerRole.Imp },
        { playerId: "p2", roleDefinitionId: ClocktowerRole.Butler },
        { playerId: "p3", roleDefinitionId: ClocktowerRole.Chef },
        { playerId: "p4", roleDefinitionId: ClocktowerRole.Empath },
        { playerId: "p5", roleDefinitionId: ClocktowerRole.Soldier },
      ],
    });
    expect(
      castPublicVoteAction.isValid(game, "p2", {
        nomineeId: "p3",
        voted: true,
      }),
    ).toBe(true);
  });
});

describe("castPublicVoteAction.apply", () => {
  it("records a vote on the matching nomination", () => {
    const { game } = makeGameWithNomination();
    castPublicVoteAction.apply(game, { nomineeId: "p3", voted: true }, "p4");
    const nominations = getDayPhase(game).nominations;
    expect(nominations[0]?.votes).toContainEqual({
      playerId: "p4",
      voted: true,
    });
  });

  it("updates an existing vote", () => {
    const ts = makeDayTurnState(
      {},
      {
        nominations: [
          {
            nominatorId: "p2",
            nomineeId: "p3",
            votes: [{ playerId: "p4", voted: false }],
          },
        ],
      },
    );
    const game = makePlayingGame(ts);
    castPublicVoteAction.apply(game, { nomineeId: "p3", voted: true }, "p4");
    const nominations = getDayPhase(game).nominations;
    expect(nominations[0]?.votes).toHaveLength(1);
    expect(nominations[0]?.votes[0]).toEqual({ playerId: "p4", voted: true });
  });

  it("records ghost vote usage for a dead player voting yes", () => {
    const { game } = makeGameWithNomination("p3", {
      deadPlayerIds: ["p4"],
    });
    castPublicVoteAction.apply(game, { nomineeId: "p3", voted: true }, "p4");
    expect(getTurnState(game).ghostVotesUsed).toContain("p4");
  });

  it("does not record ghost vote usage for a living player voting yes", () => {
    const { game } = makeGameWithNomination();
    castPublicVoteAction.apply(game, { nomineeId: "p3", voted: true }, "p4");
    expect(getTurnState(game).ghostVotesUsed).not.toContain("p4");
  });
});
