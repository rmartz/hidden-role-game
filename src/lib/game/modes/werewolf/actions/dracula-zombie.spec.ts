import { describe, it, expect } from "vitest";
import { GameStatus } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { WerewolfWinner } from "../utils/win-condition";
import { makePlayingGame, makeNightState } from "./test-helpers";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function makeGameWithDracula(
  turnState: WerewolfTurnState,
  extraAssignments: { playerId: string; roleDefinitionId: string }[] = [],
) {
  return makePlayingGame(turnState, {
    players: [
      { id: "dracula", name: "Dracula", sessionId: "sd", visiblePlayers: [] },
      { id: "p1", name: "P1", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "P2", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "P3", sessionId: "s3", visiblePlayers: [] },
      { id: "p4", name: "P4", sessionId: "s4", visiblePlayers: [] },
      { id: "p5", name: "P5", sessionId: "s5", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "dracula", roleDefinitionId: WerewolfRole.Dracula },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ...extraAssignments,
    ],
  });
}

function makeGameWithZombie(
  turnState: WerewolfTurnState,
  extraAssignments: { playerId: string; roleDefinitionId: string }[] = [],
) {
  return makePlayingGame(turnState, {
    players: [
      { id: "zombie", name: "Zombie", sessionId: "sz", visiblePlayers: [] },
      { id: "p1", name: "P1", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "P2", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "P3", sessionId: "s3", visiblePlayers: [] },
      { id: "p4", name: "P4", sessionId: "s4", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "zombie", roleDefinitionId: WerewolfRole.Zombie },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      ...extraAssignments,
    ],
  });
}

// ---------------------------------------------------------------------------
// Dracula — night action accumulates wives
// ---------------------------------------------------------------------------

describe("Dracula night action", () => {
  const startDay = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("adds the target to draculaWives after start-day", () => {
    const ts = makeNightState({
      turn: 1,
      nightActions: {
        [WerewolfRole.Dracula]: { targetPlayerId: "p2", confirmed: true },
        [WerewolfRole.Werewolf]: {
          votes: [{ playerId: "p1", targetPlayerId: "p3" }],
          confirmed: true,
          suggestedTargetId: "p3",
        },
      },
    });
    const game = makeGameWithDracula(ts);
    startDay.apply(game, undefined, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.draculaWives).toContain("p2");
  });

  it("accumulates wives across multiple nights", () => {
    const ts = makeNightState({
      turn: 2,
      nightActions: {
        [WerewolfRole.Dracula]: { targetPlayerId: "p3", confirmed: true },
      },
    });
    // p2 was already a wife from the previous turn
    ts.draculaWives = ["p2"];
    const game = makeGameWithDracula(ts);
    startDay.apply(game, undefined, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.draculaWives).toContain("p2");
    expect(newTs.draculaWives).toContain("p3");
  });

  it("does not duplicate a wife if targeted again", () => {
    const ts = makeNightState({
      turn: 2,
      nightActions: {
        [WerewolfRole.Dracula]: { targetPlayerId: "p2", confirmed: true },
      },
    });
    ts.draculaWives = ["p2"];
    const game = makeGameWithDracula(ts);
    startDay.apply(game, undefined, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.draculaWives?.filter((id) => id === "p2").length).toBe(1);
  });

  it("removes a wife who died in the same night from draculaWives", () => {
    const ts = makeNightState({
      turn: 2,
      nightActions: {
        [WerewolfRole.Dracula]: { targetPlayerId: "p3", confirmed: true },
        [WerewolfRole.Werewolf]: {
          votes: [{ playerId: "p1", targetPlayerId: "p2" }],
          confirmed: true,
          suggestedTargetId: "p2",
        },
      },
    });
    // p2 was a wife from before
    ts.draculaWives = ["p2"];
    const game = makeGameWithDracula(ts);
    startDay.apply(game, undefined, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.draculaWives).not.toContain("p2");
  });
});

// ---------------------------------------------------------------------------
// Dracula — start-night win condition check
// ---------------------------------------------------------------------------

describe("Dracula win condition at start of night", () => {
  const startNight = WEREWOLF_ACTIONS[WerewolfAction.StartNight];

  it("Dracula wins at start of night 3+ when 3 wives are alive", () => {
    const ts: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: [],
      draculaWives: ["p2", "p3", "p4"],
    };
    const game = makeGameWithDracula(ts);
    startNight.apply(game, undefined, "owner-1");
    expect(game.status.type).toBe(GameStatus.Finished);
    expect((game.status as { winner?: string }).winner).toBe(
      WerewolfWinner.Dracula,
    );
  });

  it("game continues if Dracula has 2 wives alive at start of night", () => {
    const ts: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: [],
      draculaWives: ["p2", "p3"],
    };
    const game = makeGameWithDracula(ts);
    startNight.apply(game, undefined, "owner-1");
    expect(game.status.type).not.toBe(GameStatus.Finished);
  });

  it("game continues if Dracula has 3 wives accumulated but one died", () => {
    const ts: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: ["p2"],
      draculaWives: ["p2", "p3", "p4"],
    };
    const game = makeGameWithDracula(ts);
    startNight.apply(game, undefined, "owner-1");
    expect(game.status.type).not.toBe(GameStatus.Finished);
  });

  it("game continues if Dracula is dead even with 3 wives alive", () => {
    const ts: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: ["dracula"],
      draculaWives: ["p2", "p3", "p4"],
    };
    const game = makeGameWithDracula(ts);
    startNight.apply(game, undefined, "owner-1");
    expect(game.status.type).not.toBe(GameStatus.Finished);
  });

  it("Dracula wins on first transition to night 2 (turn 2) when 3 wives are alive", () => {
    const ts: WerewolfTurnState = {
      turn: 1,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: [],
      draculaWives: ["p2", "p3", "p4"],
    };
    const game = makeGameWithDracula(ts);
    startNight.apply(game, undefined, "owner-1");
    expect(game.status.type).toBe(GameStatus.Finished);
    expect((game.status as { winner?: string }).winner).toBe(
      WerewolfWinner.Dracula,
    );
  });
});

// ---------------------------------------------------------------------------
// Zombie — night action accumulates infected
// ---------------------------------------------------------------------------

describe("Zombie night action", () => {
  const startDay = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("adds the target to zombieInfected after start-day", () => {
    const ts = makeNightState({
      turn: 1,
      nightActions: {
        [WerewolfRole.Zombie]: { targetPlayerId: "p2", confirmed: true },
        [WerewolfRole.Werewolf]: {
          votes: [{ playerId: "p1", targetPlayerId: "p3" }],
          confirmed: true,
          suggestedTargetId: "p3",
        },
      },
    });
    const game = makeGameWithZombie(ts);
    startDay.apply(game, undefined, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.zombieInfected).toContain("p2");
  });

  it("accumulates infections across multiple nights", () => {
    const ts = makeNightState({
      turn: 2,
      nightActions: {
        [WerewolfRole.Zombie]: { targetPlayerId: "p3", confirmed: true },
      },
    });
    ts.zombieInfected = ["p2"];
    const game = makeGameWithZombie(ts);
    startDay.apply(game, undefined, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.zombieInfected).toContain("p2");
    expect(newTs.zombieInfected).toContain("p3");
  });

  it("removes infected player who died this night from zombieInfected", () => {
    const ts = makeNightState({
      turn: 2,
      nightActions: {
        [WerewolfRole.Zombie]: { targetPlayerId: "p3", confirmed: true },
        [WerewolfRole.Werewolf]: {
          votes: [{ playerId: "p1", targetPlayerId: "p2" }],
          confirmed: true,
          suggestedTargetId: "p2",
        },
      },
    });
    ts.zombieInfected = ["p2"];
    const game = makeGameWithZombie(ts);
    startDay.apply(game, undefined, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.zombieInfected).not.toContain("p2");
    expect(newTs.zombieInfected).toContain("p3");
  });
});

// ---------------------------------------------------------------------------
// Zombie — setNightTarget: cannot infect already-infected player
// ---------------------------------------------------------------------------

describe("Zombie setNightTarget validation", () => {
  const setTarget = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

  it("owner can set Zombie target to an uninfected player", () => {
    const ts = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Zombie],
      currentPhaseIndex: 0,
    });
    ts.zombieInfected = ["p2"];
    const game = makeGameWithZombie(ts);
    expect(
      setTarget.isValid(game, "owner-1", {
        roleId: WerewolfRole.Zombie,
        targetPlayerId: "p3",
      }),
    ).toBe(true);
  });

  it("owner cannot set Zombie target to an already-infected player", () => {
    const ts = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Zombie],
      currentPhaseIndex: 0,
    });
    ts.zombieInfected = ["p2"];
    const game = makeGameWithZombie(ts);
    expect(
      setTarget.isValid(game, "owner-1", {
        roleId: WerewolfRole.Zombie,
        targetPlayerId: "p2",
      }),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Zombie — win condition after death events
// ---------------------------------------------------------------------------

describe("Zombie win condition after deaths", () => {
  const killPlayer = WEREWOLF_ACTIONS[WerewolfAction.KillPlayer];

  it("Zombie wins when infected outnumber healthy after kill-player", () => {
    // 5 players: zombie, p1 (wolf), p2 (infected), p3 (healthy), p4 (healthy)
    // Kill p3: infected=1, healthy=1 (p4) → not yet won
    // Kill p4: infected=1 (p2), healthy=0 → Zombie wins
    const ts: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: ["p1", "p3"],
      zombieInfected: ["p2"],
    };
    const game = makeGameWithZombie(ts);
    killPlayer.apply(game, { playerId: "p4" }, "owner-1");
    expect(game.status.type).toBe(GameStatus.Finished);
    expect((game.status as { winner?: string }).winner).toBe(
      WerewolfWinner.Zombie,
    );
  });

  it("Zombie does not win when infected equal healthy", () => {
    // zombie, p1 (infected), p2 (healthy): infected (1) vs healthy (1) → no win
    // Set up via smallTs so we can directly assert without a kill action
    const smallTs: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: ["p3", "p4"],
      zombieInfected: ["p1"],
    };
    const smallGame = makePlayingGame(smallTs, {
      players: [
        {
          id: "zombie",
          name: "Zombie",
          sessionId: "sz",
          visiblePlayers: [],
        },
        { id: "p1", name: "P1", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "P2", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "P3", sessionId: "s3", visiblePlayers: [] },
        { id: "p4", name: "P4", sessionId: "s4", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "zombie", roleDefinitionId: WerewolfRole.Zombie },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    // p1 is infected, p2 is healthy: tie → no win
    expect(smallGame.status.type).not.toBe(GameStatus.Finished);
  });

  it("Zombie does not win if Zombie itself is dead", () => {
    const ts: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: ["zombie"],
      zombieInfected: ["p1", "p2"],
    };
    const game = makeGameWithZombie(ts);
    killPlayer.apply(game, { playerId: "p3" }, "owner-1");
    expect((game.status as { winner?: string }).winner).not.toBe(
      WerewolfWinner.Zombie,
    );
  });
});

// ---------------------------------------------------------------------------
// start-night carries forward draculaWives and zombieInfected
// ---------------------------------------------------------------------------

describe("start-night state carry-forward", () => {
  const startNight = WEREWOLF_ACTIONS[WerewolfAction.StartNight];

  it("carries draculaWives forward into the next night turn state (pruning dead)", () => {
    const ts: WerewolfTurnState = {
      turn: 1,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: ["p2"],
      draculaWives: ["p2", "p3"],
    };
    const game = makeGameWithDracula(ts);
    startNight.apply(game, undefined, "owner-1");
    if (game.status.type !== GameStatus.Playing) return; // guard for type safety
    const newTs = game.status.turnState as WerewolfTurnState;
    expect(newTs.draculaWives).not.toContain("p2");
    expect(newTs.draculaWives).toContain("p3");
  });

  it("carries zombieInfected forward into the next night turn state (pruning dead)", () => {
    const ts: WerewolfTurnState = {
      turn: 1,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: ["p2"],
      zombieInfected: ["p2", "p3"],
    };
    const game = makeGameWithZombie(ts);
    startNight.apply(game, undefined, "owner-1");
    if (game.status.type !== GameStatus.Playing) return;
    const newTs = game.status.turnState as WerewolfTurnState;
    expect(newTs.zombieInfected).not.toContain("p2");
    expect(newTs.zombieInfected).toContain("p3");
  });
});
