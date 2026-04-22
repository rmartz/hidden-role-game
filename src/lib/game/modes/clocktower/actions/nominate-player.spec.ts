import { describe, it, expect } from "vitest";
import { nominatePlayerAction } from "./nominate-player";
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

describe("nominatePlayerAction.isValid", () => {
  it("allows a living player to nominate another living player", () => {
    const ts = makeDayTurnState();
    const game = makePlayingGame(ts);
    expect(nominatePlayerAction.isValid(game, "p2", { nomineeId: "p3" })).toBe(
      true,
    );
  });

  it("rejects when game is not in playing state", () => {
    const ts = makeDayTurnState();
    const game = makePlayingGame(ts);
    // @ts-expect-error — override status for test
    game.status = { type: GameStatus.Lobby };
    expect(nominatePlayerAction.isValid(game, "p2", { nomineeId: "p3" })).toBe(
      false,
    );
  });

  it("rejects during the night phase", () => {
    const ts = makeDayTurnState();
    // @ts-expect-error — override phase for test
    ts.phase = { type: "night", currentActionIndex: 0, nightActions: {} };
    const game = makePlayingGame(ts);
    expect(nominatePlayerAction.isValid(game, "p2", { nomineeId: "p3" })).toBe(
      false,
    );
  });

  it("rejects when someone was already executed today", () => {
    const ts = makeDayTurnState({}, { executedToday: "p4" });
    const game = makePlayingGame(ts);
    expect(nominatePlayerAction.isValid(game, "p2", { nomineeId: "p3" })).toBe(
      false,
    );
  });

  it("rejects when the caller is dead", () => {
    const ts = makeDayTurnState({ deadPlayerIds: ["p2"] });
    const game = makePlayingGame(ts);
    expect(nominatePlayerAction.isValid(game, "p2", { nomineeId: "p3" })).toBe(
      false,
    );
  });

  it("rejects when the caller has already nominated today", () => {
    const ts = makeDayTurnState({}, { nominatedByPlayerIds: ["p2"] });
    const game = makePlayingGame(ts);
    expect(nominatePlayerAction.isValid(game, "p2", { nomineeId: "p3" })).toBe(
      false,
    );
  });

  it("rejects a self-nomination", () => {
    const ts = makeDayTurnState();
    const game = makePlayingGame(ts);
    expect(nominatePlayerAction.isValid(game, "p2", { nomineeId: "p2" })).toBe(
      false,
    );
  });

  it("rejects a nominee who is not a player", () => {
    const ts = makeDayTurnState();
    const game = makePlayingGame(ts);
    expect(
      nominatePlayerAction.isValid(game, "p2", { nomineeId: "unknown" }),
    ).toBe(false);
  });

  it("rejects when nomineeId is not a string", () => {
    const ts = makeDayTurnState();
    const game = makePlayingGame(ts);
    expect(nominatePlayerAction.isValid(game, "p2", { nomineeId: 42 })).toBe(
      false,
    );
  });

  it("rejects Butler nominating their master", () => {
    const ts = makeDayTurnState({ butlerMasterId: "p3" });
    const game = makePlayingGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: ClocktowerRole.Imp },
        { playerId: "p2", roleDefinitionId: ClocktowerRole.Butler },
        { playerId: "p3", roleDefinitionId: ClocktowerRole.Chef },
        { playerId: "p4", roleDefinitionId: ClocktowerRole.Empath },
        { playerId: "p5", roleDefinitionId: ClocktowerRole.Soldier },
      ],
    });
    expect(nominatePlayerAction.isValid(game, "p2", { nomineeId: "p3" })).toBe(
      false,
    );
  });

  it("allows Butler to nominate a non-master", () => {
    const ts = makeDayTurnState({ butlerMasterId: "p3" });
    const game = makePlayingGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: ClocktowerRole.Imp },
        { playerId: "p2", roleDefinitionId: ClocktowerRole.Butler },
        { playerId: "p3", roleDefinitionId: ClocktowerRole.Chef },
        { playerId: "p4", roleDefinitionId: ClocktowerRole.Empath },
        { playerId: "p5", roleDefinitionId: ClocktowerRole.Soldier },
      ],
    });
    expect(nominatePlayerAction.isValid(game, "p2", { nomineeId: "p4" })).toBe(
      true,
    );
  });
});

describe("nominatePlayerAction.apply", () => {
  it("adds a nomination to the day phase", () => {
    const ts = makeDayTurnState();
    const game = makePlayingGame(ts);
    nominatePlayerAction.apply(game, { nomineeId: "p3" }, "p2");
    const phase = getDayPhase(game);
    expect(phase.nominations).toHaveLength(1);
    expect(phase.nominations[0]).toMatchObject({
      nominatorId: "p2",
      nomineeId: "p3",
      votes: [],
    });
  });

  it("records the nominator in nominatedByPlayerIds", () => {
    const ts = makeDayTurnState();
    const game = makePlayingGame(ts);
    nominatePlayerAction.apply(game, { nomineeId: "p3" }, "p2");
    expect(getDayPhase(game).nominatedByPlayerIds).toContain("p2");
  });

  it("triggers Virgin ability: executes Townsfolk nominator instead", () => {
    const ts = makeDayTurnState();
    const game = makePlayingGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: ClocktowerRole.Imp },
        { playerId: "p2", roleDefinitionId: ClocktowerRole.Washerwoman }, // Townsfolk
        { playerId: "p3", roleDefinitionId: ClocktowerRole.Virgin },
        { playerId: "p4", roleDefinitionId: ClocktowerRole.Empath },
        { playerId: "p5", roleDefinitionId: ClocktowerRole.Soldier },
      ],
    });
    nominatePlayerAction.apply(game, { nomineeId: "p3" }, "p2");
    const phase = getDayPhase(game);
    const updatedTs = getTurnState(game);
    // Nominator p2 is executed
    expect(phase.executedToday).toBe("p2");
    expect(updatedTs.deadPlayerIds).toContain("p2");
    // No open nomination added
    expect(phase.nominations).toHaveLength(0);
    // Virgin ability is consumed
    expect(updatedTs.virginAbilityUsed).toBe(true);
  });

  it("does not trigger Virgin ability a second time", () => {
    const ts = makeDayTurnState({ virginAbilityUsed: true });
    const game = makePlayingGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: ClocktowerRole.Imp },
        { playerId: "p2", roleDefinitionId: ClocktowerRole.Washerwoman },
        { playerId: "p3", roleDefinitionId: ClocktowerRole.Virgin },
        { playerId: "p4", roleDefinitionId: ClocktowerRole.Empath },
        { playerId: "p5", roleDefinitionId: ClocktowerRole.Soldier },
      ],
    });
    nominatePlayerAction.apply(game, { nomineeId: "p3" }, "p2");
    const phase = getDayPhase(game);
    // Normal nomination proceeds
    expect(phase.nominations).toHaveLength(1);
    expect(phase.executedToday).toBeUndefined();
  });

  it("does not trigger Virgin ability when nominator is poisoned", () => {
    const ts = makeDayTurnState({ poisonedPlayerId: "p2" });
    const game = makePlayingGame(ts, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: ClocktowerRole.Imp },
        { playerId: "p2", roleDefinitionId: ClocktowerRole.Washerwoman },
        { playerId: "p3", roleDefinitionId: ClocktowerRole.Virgin },
        { playerId: "p4", roleDefinitionId: ClocktowerRole.Empath },
        { playerId: "p5", roleDefinitionId: ClocktowerRole.Soldier },
      ],
    });
    nominatePlayerAction.apply(game, { nomineeId: "p3" }, "p2");
    const phase = getDayPhase(game);
    // Nomination proceeds normally — poisoned Townsfolk does not trigger ability
    expect(phase.nominations).toHaveLength(1);
    expect(phase.executedToday).toBeUndefined();
  });
});
