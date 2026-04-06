import { describe, it, expect } from "vitest";
import { WerewolfRole } from "@/lib/game/modes/werewolf";
import { extractPlayerNightState } from "../services/player-night-state";
import { mentalistRole, makeMentalistGame } from "./mentalist-helpers";

describe("extractPlayerNightState (Mentalist targeting)", () => {
  it("returns myNightTarget and mySecondNightTarget when both are set", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: {
        targetPlayerId: "p2",
        secondTargetPlayerId: "p3",
      },
    };
    const game = makeMentalistGame(
      WerewolfRole.Werewolf,
      WerewolfRole.Villager,
      nightActions,
    );
    const result = extractPlayerNightState(game, "p1", mentalistRole, []);
    expect(result.myNightTarget).toBe("p2");
    expect(result.mySecondNightTarget).toBe("p3");
  });

  it("mySecondNightTarget is absent when only the first target is set", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: { targetPlayerId: "p2" },
    };
    const game = makeMentalistGame(
      WerewolfRole.Werewolf,
      WerewolfRole.Villager,
      nightActions,
    );
    const result = extractPlayerNightState(game, "p1", mentalistRole, []);
    expect(result.myNightTarget).toBe("p2");
    expect(result.mySecondNightTarget).toBeUndefined();
  });

  it("investigationResult is absent before narrator reveals it", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: {
        targetPlayerId: "p2",
        secondTargetPlayerId: "p3",
        confirmed: true,
        resultRevealed: false,
      },
    };
    const game = makeMentalistGame(
      WerewolfRole.Werewolf,
      WerewolfRole.Villager,
      nightActions,
    );
    const result = extractPlayerNightState(game, "p1", mentalistRole, []);
    expect(result.investigationResult).toBeUndefined();
  });

  it("falls through to standard isWerewolf result when secondTargetPlayerId is missing", () => {
    const nightActions = {
      [WerewolfRole.Mentalist]: {
        targetPlayerId: "p2",
        confirmed: true,
        resultRevealed: true,
      },
    };
    const game = makeMentalistGame(
      WerewolfRole.Seer,
      WerewolfRole.Villager,
      nightActions,
    );
    const result = extractPlayerNightState(game, "p1", mentalistRole, []);
    expect(result.investigationResult).toEqual({
      targetPlayerId: "p2",
      isWerewolfTeam: false,
    });
  });
});
