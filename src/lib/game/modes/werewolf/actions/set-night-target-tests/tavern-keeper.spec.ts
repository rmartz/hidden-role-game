import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "../index";
import { makePlayingGame, makeNightState } from "../test-helpers";

const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

// ---------------------------------------------------------------------------
// SetNightTarget — Tavern Keeper block
// ---------------------------------------------------------------------------

describe("WerewolfAction.SetNightTarget — Tavern Keeper block", () => {
  it("blocks the targeted player from submitting a night action", () => {
    const ts = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
      currentPhaseIndex: 1, // Seer's turn
    });
    ts.tavernKeeperBlockedPlayerId = "p2"; // p2 is the Seer
    const game = makePlayingGame(ts);
    expect(action.isValid(game, "p2", { targetPlayerId: "p1" })).toBe(false);
  });

  it("allows the owner to set a target for a blocked player's phase", () => {
    const ts = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Seer],
      currentPhaseIndex: 0,
    });
    ts.tavernKeeperBlockedPlayerId = "p2"; // p2 is the Seer
    const game = makePlayingGame(ts);
    // Owner can still override on behalf of a blocked player
    expect(
      action.isValid(game, "owner-1", {
        roleId: WerewolfRole.Seer,
        targetPlayerId: "p1",
      }),
    ).toBe(true);
  });

  it("does not block an unblocked player from acting", () => {
    const ts = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
      currentPhaseIndex: 0, // Werewolf's turn
    });
    ts.tavernKeeperBlockedPlayerId = "p2"; // p2 (Seer) is blocked, not p1 (Wolf)
    const game = makePlayingGame(ts);
    expect(action.isValid(game, "p1", { targetPlayerId: "p3" })).toBe(true);
  });
});
