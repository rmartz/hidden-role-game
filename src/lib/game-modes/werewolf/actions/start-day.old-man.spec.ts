import { describe, it, expect } from "vitest";
import type { WerewolfTurnState, WerewolfDaytimePhase } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame, makeNightState } from "./test-helpers";

// ---------------------------------------------------------------------------
// StartDay — Old Man timer tests
// ---------------------------------------------------------------------------

describe("WerewolfAction.StartDay — Old Man timer", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  const oldManRoleAssignments = [
    { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
    { playerId: "p2", roleDefinitionId: WerewolfRole.OldMan },
    { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
    { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
    { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
  ];

  it("Old Man dies peacefully on turn #WW+2 when not attacked", () => {
    // 1 werewolf → timer fires on turn 3
    const game = makePlayingGame(makeNightState({ turn: 3 }), {
      roleAssignments: oldManRoleAssignments,
    });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).toContain("p2");
  });

  it("Old Man does NOT die on turn #WW+1 (too early)", () => {
    // 1 werewolf → timer fires on turn 3, not turn 2
    const game = makePlayingGame(makeNightState({ turn: 2 }), {
      roleAssignments: oldManRoleAssignments,
    });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).not.toContain("p2");
  });

  it("Old Man does NOT die if already dead", () => {
    const game = makePlayingGame(
      makeNightState({ turn: 3, deadPlayerIds: ["p2"] }),
      { roleAssignments: oldManRoleAssignments },
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    // p2 should appear only once (was already dead)
    expect(ts.deadPlayerIds.filter((id) => id === "p2")).toHaveLength(1);
  });

  it("Wolf Cub counts toward werewolf total for timer", () => {
    // 1 werewolf + 1 wolf cub = 2 → timer fires on turn 4
    const withCub = [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p6", roleDefinitionId: WerewolfRole.WolfCub },
      { playerId: "p2", roleDefinitionId: WerewolfRole.OldMan },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
    ];
    const players = [
      { id: "p1", name: "W1", sessionId: "s1", visiblePlayers: [] as [] },
      { id: "p6", name: "WC", sessionId: "s6", visiblePlayers: [] as [] },
      { id: "p2", name: "OM", sessionId: "s2", visiblePlayers: [] as [] },
      { id: "p3", name: "V1", sessionId: "s3", visiblePlayers: [] as [] },
      { id: "p4", name: "V2", sessionId: "s4", visiblePlayers: [] as [] },
      { id: "p5", name: "V3", sessionId: "s5", visiblePlayers: [] as [] },
    ];

    // Turn 3: too early (need turn 4)
    const game3 = makePlayingGame(makeNightState({ turn: 3 }), {
      roleAssignments: withCub,
      players,
    });
    action.apply(game3, null, "owner-1");
    const ts3 = (game3.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts3.deadPlayerIds).not.toContain("p2");

    // Turn 4: timer fires
    const game4 = makePlayingGame(makeNightState({ turn: 4 }), {
      roleAssignments: withCub,
      players,
    });
    action.apply(game4, null, "owner-1");
    const ts4 = (game4.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts4.deadPlayerIds).toContain("p2");
  });

  it("Old Man dies normally when attacked on the same turn the timer fires", () => {
    // 1 werewolf → timer fires on turn 3
    // Wolves also attack the Old Man this night
    const game = makePlayingGame(
      makeNightState({
        turn: 3,
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p2",
          },
        },
      }),
      { roleAssignments: oldManRoleAssignments },
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).toContain("p2");
    // Should be a normal kill (wolf attack), not a peaceful timer death
    const phase = ts.phase as WerewolfDaytimePhase;
    const killEvent = phase.nightResolution?.find(
      (e) => e.type === "killed" && e.targetPlayerId === "p2",
    );
    expect(killEvent).toBeDefined();
    if (killEvent?.type === "killed") {
      expect(killEvent.attackedBy).toContain(WerewolfRole.Werewolf);
      expect(killEvent.attackedBy).not.toContain("__old_man_timer__");
    }
  });
});
