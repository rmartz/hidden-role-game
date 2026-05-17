import { describe, expect, it } from "vitest";

import { WerewolfRole } from "../../roles";
import { WEREWOLF_ACTIONS, WerewolfAction } from "../index";
import { makeNightState, makePlayingGame } from "../test-helpers";

const action = WEREWOLF_ACTIONS[WerewolfAction.SetNightTarget];

// ---------------------------------------------------------------------------
// SetNightTarget — Tavern Keeper (retroactive-undo mechanic)
// There is no longer a block guard at submit time. Players submit normally;
// the TK's target is undone retroactively during resolution.
// ---------------------------------------------------------------------------

describe("WerewolfAction.SetNightTarget — Tavern Keeper", () => {
  it("allows a player to submit a night action during the Seer phase (no TK block at submit time)", () => {
    const ts = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Seer],
      currentPhaseIndex: 0, // Seer's turn
    });
    const game = makePlayingGame(ts);
    // p2 is the Seer — previously would be blocked if TK targeted them, now they can act freely
    expect(action.isValid(game, "p2", { targetPlayerId: "p1" })).toBe(true);
  });

  it("allows the owner to set a target for the Seer phase", () => {
    const ts = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Seer],
      currentPhaseIndex: 0,
    });
    const game = makePlayingGame(ts);
    expect(
      action.isValid(game, "owner-1", {
        roleId: WerewolfRole.Seer,
        targetPlayerId: "p1",
      }),
    ).toBe(true);
  });

  it("does not block any player from submitting a night action", () => {
    // With the old mechanic, setting roleState.tavernKeeper.blockedPlayerId
    // would prevent the blocked player from calling SetNightTarget. Verify
    // that this guard is gone — no roleState.tavernKeeper entry exists anymore.
    const ts = makeNightState({
      turn: 2,
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
      currentPhaseIndex: 0, // Werewolf's turn
    });
    const game = makePlayingGame(ts);
    // p1 (Werewolf) can submit their action unimpeded
    expect(action.isValid(game, "p1", { targetPlayerId: "p3" })).toBe(true);
  });
});
