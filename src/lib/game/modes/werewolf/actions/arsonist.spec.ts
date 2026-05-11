import { describe, it, expect } from "vitest";
import { GameStatus } from "@/lib/types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { WerewolfWinner } from "../utils/win-condition";
import { makePlayingGame, makeNightState } from "./test-helpers";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function makeGameWithArsonist(
  turnState: WerewolfTurnState,
  extraAssignments: { playerId: string; roleDefinitionId: string }[] = [],
) {
  return makePlayingGame(turnState, {
    players: [
      {
        id: "arsonist",
        name: "Arsonist",
        sessionId: "sa",
        visiblePlayers: [],
      },
      { id: "p1", name: "P1", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "P2", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "P3", sessionId: "s3", visiblePlayers: [] },
      { id: "p4", name: "P4", sessionId: "s4", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "arsonist", roleDefinitionId: WerewolfRole.Arsonist },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      ...extraAssignments,
    ],
  });
}

// ---------------------------------------------------------------------------
// Arsonist — dousing (target = another player)
// ---------------------------------------------------------------------------

describe("Arsonist — dousing", () => {
  const startDay = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("adds targeted player to arsonistDousedPlayerIds after start-day", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: { targetPlayerId: "p2", confirmed: true },
      },
    });
    const game = makeGameWithArsonist(ts);
    startDay.apply(game, null, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.arsonistDousedPlayerIds).toEqual(["p2"]);
  });

  it("accumulates doused players across nights", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: { targetPlayerId: "p3", confirmed: true },
      },
    });
    // p2 was doused on a previous night
    ts.arsonistDousedPlayerIds = ["p2"];
    const game = makeGameWithArsonist(ts);
    startDay.apply(game, null, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.arsonistDousedPlayerIds).toContain("p2");
    expect(newTs.arsonistDousedPlayerIds).toContain("p3");
  });

  it("does not duplicate already-doused player", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: { targetPlayerId: "p2", confirmed: true },
      },
    });
    ts.arsonistDousedPlayerIds = ["p2"];
    const game = makeGameWithArsonist(ts);
    startDay.apply(game, null, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(
      newTs.arsonistDousedPlayerIds?.filter((id) => id === "p2"),
    ).toHaveLength(1);
  });

  it("does not add a player who died this night to the doused list", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: { targetPlayerId: "p2", confirmed: true },
        [WerewolfRole.Werewolf]: {
          votes: [{ playerId: "p1", targetPlayerId: "p2" }],
          confirmed: true,
          suggestedTargetId: "p2",
        },
      },
    });
    const game = makeGameWithArsonist(ts);
    startDay.apply(game, null, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.arsonistDousedPlayerIds ?? []).not.toContain("p2");
  });

  it("carries doused list forward through start-night", () => {
    const startDayTs = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: { targetPlayerId: "p2", confirmed: true },
      },
    });
    const game = makeGameWithArsonist(startDayTs);
    startDay.apply(game, null, "owner-1");

    // Now start the next night
    const startNight = WEREWOLF_ACTIONS[WerewolfAction.StartNight];
    startNight.apply(game, null, "owner-1");
    const nightTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(nightTs.arsonistDousedPlayerIds).toContain("p2");
  });
});

// ---------------------------------------------------------------------------
// Arsonist — ignite (self-target)
// ---------------------------------------------------------------------------

describe("Arsonist — ignite", () => {
  const startDay = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("kills all doused players when Arsonist self-targets", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: {
          targetPlayerId: "arsonist",
          confirmed: true,
        },
      },
    });
    ts.arsonistDousedPlayerIds = ["p2", "p3"];
    const game = makeGameWithArsonist(ts);
    startDay.apply(game, null, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.deadPlayerIds).toContain("p2");
    expect(newTs.deadPlayerIds).toContain("p3");
  });

  it("resets doused list after ignite", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: {
          targetPlayerId: "arsonist",
          confirmed: true,
        },
      },
    });
    ts.arsonistDousedPlayerIds = ["p2", "p3"];
    const game = makeGameWithArsonist(ts);
    startDay.apply(game, null, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(newTs.arsonistDousedPlayerIds ?? []).toHaveLength(0);
  });

  it("ignite with no doused players kills nobody", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: {
          targetPlayerId: "arsonist",
          confirmed: true,
        },
      },
    });
    const game = makeGameWithArsonist(ts);
    startDay.apply(game, null, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    // No extra deaths beyond werewolf's potential kill
    expect(newTs.deadPlayerIds).not.toContain("p2");
    expect(newTs.deadPlayerIds).not.toContain("p3");
  });

  it("protection (Bodyguard) saves a doused player from ignite", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: {
          targetPlayerId: "arsonist",
          confirmed: true,
        },
        [WerewolfRole.Bodyguard]: { targetPlayerId: "p2", confirmed: true },
      },
    });
    ts.arsonistDousedPlayerIds = ["p2"];
    const game = makeGameWithArsonist(ts, [
      { playerId: "p5", roleDefinitionId: WerewolfRole.Bodyguard },
    ]);
    game.players.push({
      id: "p5",
      name: "P5",
      sessionId: "s5",
      visiblePlayers: [],
    });
    startDay.apply(game, null, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    // p2 is doused but protected — should survive
    expect(newTs.deadPlayerIds).not.toContain("p2");
  });

  it("doused list resets after ignite even when Arsonist dies same night", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: {
          targetPlayerId: "arsonist",
          confirmed: true,
        },
        [WerewolfRole.Werewolf]: {
          votes: [{ playerId: "p1", targetPlayerId: "arsonist" }],
          confirmed: true,
          suggestedTargetId: "arsonist",
        },
      },
    });
    ts.arsonistDousedPlayerIds = ["p2"];
    // Use a game with many Good players so wolves don't win after arsonist dies
    const game = makePlayingGame(ts, {
      players: [
        {
          id: "arsonist",
          name: "Arsonist",
          sessionId: "sa",
          visiblePlayers: [],
        },
        { id: "p1", name: "P1", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "P2", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "P3", sessionId: "s3", visiblePlayers: [] },
        { id: "p4", name: "P4", sessionId: "s4", visiblePlayers: [] },
        { id: "p5", name: "P5", sessionId: "s5", visiblePlayers: [] },
        { id: "p6", name: "P6", sessionId: "s6", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "arsonist", roleDefinitionId: WerewolfRole.Arsonist },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p6", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    startDay.apply(game, null, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    // Arsonist died this night (killed by wolves) and ignited — list should still reset
    expect(newTs.deadPlayerIds).toContain("arsonist");
    expect(newTs.deadPlayerIds).toContain("p2");
    expect(newTs.arsonistDousedPlayerIds ?? []).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Arsonist — win condition
// ---------------------------------------------------------------------------

describe("Arsonist — win condition", () => {
  const startDay = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("Arsonist wins when all Bad are dead and ≤1 Good remains", () => {
    // p1 (Werewolf) attacked by wolves (irrelevant), p2 is the surviving Good player
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: {
          targetPlayerId: "arsonist",
          confirmed: true,
        },
      },
      deadPlayerIds: ["p1"], // werewolf already dead
    });
    ts.arsonistDousedPlayerIds = ["p3", "p4"]; // kill p3 and p4 via ignite
    const game = makeGameWithArsonist(ts);
    startDay.apply(game, null, "owner-1");
    // p3 and p4 killed by ignite; only p2 (Good) and arsonist remain
    expect(game.status.type).toBe(GameStatus.Finished);
    expect((game.status as { winner: string }).winner).toBe(
      WerewolfWinner.Arsonist,
    );
  });

  it("Arsonist wins when all Bad are dead and 0 Good remain", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: {
          targetPlayerId: "arsonist",
          confirmed: true,
        },
      },
      deadPlayerIds: ["p1"], // werewolf already dead
    });
    // Douse p2, p3, p4 (all Good)
    ts.arsonistDousedPlayerIds = ["p2", "p3", "p4"];
    const game = makeGameWithArsonist(ts);
    startDay.apply(game, null, "owner-1");
    expect(game.status.type).toBe(GameStatus.Finished);
    expect((game.status as { winner: string }).winner).toBe(
      WerewolfWinner.Arsonist,
    );
  });

  it("game continues when Arsonist is alive and >1 Good remain", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: { targetPlayerId: "p2", confirmed: true },
      },
      deadPlayerIds: ["p1"],
    });
    const game = makeGameWithArsonist(ts);
    startDay.apply(game, null, "owner-1");
    // p3 and p4 still alive (Good), game should continue
    expect(game.status.type).toBe(GameStatus.Playing);
  });

  it("game continues when both Arsonist and Chupacabra are alive with ≤1 Good", () => {
    // Both neutral killers alive — neither can win yet
    const ts = makeNightState({
      nightActions: {},
      deadPlayerIds: ["p1", "p3", "p4"], // werewolf and most Good dead
    });
    const game = makePlayingGame(ts, {
      players: [
        {
          id: "arsonist",
          name: "Arsonist",
          sessionId: "sa",
          visiblePlayers: [],
        },
        { id: "chupa", name: "Chupa", sessionId: "sc", visiblePlayers: [] },
        { id: "p1", name: "P1", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "P2", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "P3", sessionId: "s3", visiblePlayers: [] },
        { id: "p4", name: "P4", sessionId: "s4", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "arsonist", roleDefinitionId: WerewolfRole.Arsonist },
        { playerId: "chupa", roleDefinitionId: WerewolfRole.Chupacabra },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    WEREWOLF_ACTIONS[WerewolfAction.StartDay].apply(game, null, "owner-1");
    expect(game.status.type).toBe(GameStatus.Playing);
  });

  it("game continues when Bad and Arsonist are the only survivors", () => {
    // Wolf still alive vs Arsonist, no Good left — conflicting win conditions
    const ts = makeNightState({
      nightActions: {},
      deadPlayerIds: ["p2", "p3", "p4"], // All Good dead
    });
    const game = makeGameWithArsonist(ts);
    WEREWOLF_ACTIONS[WerewolfAction.StartDay].apply(game, null, "owner-1");
    // Wolf (p1) alive vs Arsonist — neither should win
    expect(game.status.type).toBe(GameStatus.Playing);
  });

  it("Werewolves win when Bad count equals Arsonist (no Good)", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Werewolf]: {
          votes: [{ playerId: "p1", targetPlayerId: "arsonist" }],
          confirmed: true,
          suggestedTargetId: "arsonist",
        },
      },
      deadPlayerIds: ["p2", "p3", "p4"],
    });
    const game = makeGameWithArsonist(ts);
    WEREWOLF_ACTIONS[WerewolfAction.StartDay].apply(game, null, "owner-1");
    // Arsonist killed by wolves, no non-bad remain
    expect(game.status.type).toBe(GameStatus.Finished);
    expect((game.status as { winner: string }).winner).toBe(
      WerewolfWinner.Werewolves,
    );
  });

  it("daytime phase carries over arsonistDousedPlayerIds", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Arsonist]: { targetPlayerId: "p2", confirmed: true },
      },
    });
    const game = makeGameWithArsonist(ts);
    startDay.apply(game, null, "owner-1");
    const dayTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    // Start next night
    WEREWOLF_ACTIONS[WerewolfAction.StartNight].apply(game, null, "owner-1");
    const nightTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    // Doused list from previous day should be in the next night's turn state
    expect(nightTs.arsonistDousedPlayerIds).toEqual(
      dayTs.arsonistDousedPlayerIds,
    );
  });
});

// ---------------------------------------------------------------------------
// Arsonist — doused list cleared of dead players
// ---------------------------------------------------------------------------

describe("Arsonist — dead players removed from doused list", () => {
  const startDay = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("removes doused players who die via werewolf attack from the list", () => {
    const ts = makeNightState({
      nightActions: {
        [WerewolfRole.Werewolf]: {
          votes: [{ playerId: "p1", targetPlayerId: "p2" }],
          confirmed: true,
          suggestedTargetId: "p2",
        },
      },
    });
    ts.arsonistDousedPlayerIds = ["p2"];
    const game = makeGameWithArsonist(ts);
    startDay.apply(game, null, "owner-1");
    const newTs = (game.status as { turnState: WerewolfTurnState }).turnState;
    // p2 died via wolves — should be removed from doused list
    expect(newTs.arsonistDousedPlayerIds ?? []).not.toContain("p2");
  });
});
