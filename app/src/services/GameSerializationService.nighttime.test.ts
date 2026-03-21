import { describe, it, expect } from "vitest";
import { WerewolfRole } from "@/lib/game-modes/werewolf";
import { GameSerializationService } from "./GameSerializationService";
import {
  makeNighttimeGame,
  makeNighttimeGameWithBonusPhase,
  witchRole,
  werewolfRole,
  BONUS_PHASE_KEY,
} from "./GameSerializationService.nighttime-helpers";

// ---------------------------------------------------------------------------
// extractPlayerNightState — Witch
// ---------------------------------------------------------------------------

describe("GameSerializationService.extractPlayerNightState (Witch)", () => {
  const service = new GameSerializationService();

  it("returns witchAbilityUsed and nightStatus even when Witch has not acted yet", () => {
    const nightActions = {
      [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p2" },
    };
    const game = makeNighttimeGame(nightActions);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p3",
      witchRole,
      [],
    );
    expect(result.witchAbilityUsed).toBe(false);
    expect(result.nightStatus).toEqual([
      { targetPlayerId: "p2", effect: "attacked" },
    ]);
    expect(result.myNightTarget).toBeUndefined();
  });

  it("returns myNightTarget when the Witch has chosen a target", () => {
    const nightActions = {
      [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p2" },
      [WerewolfRole.Witch]: { targetPlayerId: "p1" },
    };
    const game = makeNighttimeGame(nightActions);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p3",
      witchRole,
      [],
    );
    expect(result.myNightTarget).toBe("p1");
    expect(result.witchAbilityUsed).toBe(false);
  });

  it("returns no nightStatus when witchAbilityUsed is true", () => {
    const nightActions = {
      [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p2" },
    };
    const game = makeNighttimeGame(nightActions, true);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p3",
      witchRole,
      [],
    );
    expect(result.witchAbilityUsed).toBe(true);
    expect(result.nightStatus).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractPlayerNightState — suffixed group phase key (Wolf Cub bonus attack)
// ---------------------------------------------------------------------------

describe("GameSerializationService.extractPlayerNightState (suffixed group phase)", () => {
  const service = new GameSerializationService();

  it("myNightTargetConfirmed is false for the second phase even when the first phase is confirmed", () => {
    const nightActions = {
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
      [BONUS_PHASE_KEY]: {
        votes: [{ playerId: "w1", targetPlayerId: "p3" }],
        suggestedTargetId: "p3",
      },
    };
    const game = makeNighttimeGameWithBonusPhase(nightActions);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "w1",
      werewolfRole,
      [],
    );
    expect(result.myNightTargetConfirmed).toBe(false);
  });

  it("previousNightTargetId is set to the first phase's suggestedTargetId in the second phase", () => {
    const nightActions = {
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
      [BONUS_PHASE_KEY]: {
        votes: [],
      },
    };
    const game = makeNighttimeGameWithBonusPhase(nightActions);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "w1",
      werewolfRole,
      [],
    );
    expect(result.previousNightTargetId).toBe("p3");
  });

  it("previousNightTargetId is set even before any vote has been cast in the second phase", () => {
    const nightActions = {
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
    };
    const game = makeNighttimeGameWithBonusPhase(nightActions);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "w1",
      werewolfRole,
      [],
    );
    expect(result.previousNightTargetId).toBe("p3");
    expect(result.myNightTarget).toBeUndefined();
    expect(result.myNightTargetConfirmed).toBe(false);
  });

  it("myNightTarget reflects the player's vote in the second phase action, not the first", () => {
    const nightActions = {
      [WerewolfRole.Werewolf]: {
        votes: [
          { playerId: "w1", targetPlayerId: "p3" },
          { playerId: "w2", targetPlayerId: "p3" },
        ],
        suggestedTargetId: "p3",
        confirmed: true,
      },
      [BONUS_PHASE_KEY]: {
        votes: [],
      },
    };
    const game = makeNighttimeGameWithBonusPhase(nightActions);
    const result = service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "w1",
      werewolfRole,
      [],
    );
    expect(result.myNightTarget).toBeUndefined();
  });
});
