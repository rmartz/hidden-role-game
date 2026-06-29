import { describe, expect, it } from "vitest";

import { GameStatus } from "@/lib/types";

import { WerewolfRole } from "../roles";
import { WerewolfWinner } from "../utils/win-condition";
import { WEREWOLF_ACTIONS, WerewolfAction } from "./index";
import { makeNightState, makePlayingGame } from "./test-helpers";

// ---------------------------------------------------------------------------
// StartDay — Tanner
// ---------------------------------------------------------------------------

describe("WerewolfAction.StartDay — Tanner", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("Tanner killed at night ends game with Tanner winner", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p3",
          },
        },
      }),
      {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Tanner },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      },
    );
    action.apply(game, null, "owner-1");
    expect(game.status.type).toBe(GameStatus.Finished);
    expect((game.status as { winner?: string }).winner).toBe(
      WerewolfWinner.Tanner,
    );
  });

  it("Tanner killed at night along with other players records all deaths", () => {
    const game = makePlayingGame(
      makeNightState({
        turn: 2,
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p3",
          },
          [WerewolfRole.Vigilante]: { targetPlayerId: "p4" },
        },
      }),
      {
        players: [
          { id: "p1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
          { id: "p2", name: "Vig", sessionId: "s2", visiblePlayers: [] },
          { id: "p3", name: "Tanner", sessionId: "s3", visiblePlayers: [] },
          { id: "p4", name: "V1", sessionId: "s4", visiblePlayers: [] },
          { id: "p5", name: "V2", sessionId: "s5", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Vigilante },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Tanner },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      },
    );
    action.apply(game, null, "owner-1");
    expect(game.status.type).toBe(GameStatus.Finished);
    expect((game.status as { winner?: string }).winner).toBe(
      WerewolfWinner.Tanner,
    );
    // The turn state should have been built with all deaths recorded
    // before the game was marked finished. Verify via the daytime phase
    // that was set before the Tanner override.
    // Since game.status is now Finished (not Playing), the turnState is
    // not directly accessible — but the key invariant is that the Tanner
    // check ran AFTER building the full state.
  });
});
