import { describe, it, expect } from "vitest";
import { WerewolfRole } from "@/lib/game-modes/werewolf";
import { GameSerializationService } from "../GameSerializationService";
import { mentalistRole, makeMentalistGame } from "./mentalist-helpers";

const REVEALED_ACTIONS = {
  targetPlayerId: "p2",
  secondTargetPlayerId: "p3",
  confirmed: true,
  resultRevealed: true,
};

describe("GameSerializationService.extractPlayerNightState (Mentalist investigation)", () => {
  const service = new GameSerializationService();

  function investigate(p2Role: WerewolfRole, p3Role: WerewolfRole) {
    const nightActions = { [WerewolfRole.Mentalist]: { ...REVEALED_ACTIONS } };
    const game = makeMentalistGame(p2Role, p3Role, nightActions);
    return service.extractPlayerNightState(
      nightActions as Parameters<typeof service.extractPlayerNightState>[0],
      game,
      "p1",
      mentalistRole,
      [],
    );
  }

  it("returns 'different teams' when targets are on Good and Bad team", () => {
    const result = investigate(WerewolfRole.Werewolf, WerewolfRole.Villager);
    expect(result.investigationResult?.isWerewolfTeam).toBe(false);
    expect(result.investigationResult?.secondTargetName).toBe("Charlie");
  });

  it("returns 'same team' when both targets are on the Bad team", () => {
    const result = investigate(WerewolfRole.Werewolf, WerewolfRole.WolfCub);
    expect(result.investigationResult?.isWerewolfTeam).toBe(true);
    expect(result.investigationResult?.secondTargetName).toBe("Charlie");
  });

  it("returns 'same team' when both targets are on the Good team", () => {
    const result = investigate(WerewolfRole.Seer, WerewolfRole.Villager);
    expect(result.investigationResult?.isWerewolfTeam).toBe(true);
    expect(result.investigationResult?.secondTargetName).toBe("Charlie");
  });

  it("returns 'different teams' when first target is Neutral", () => {
    const result = investigate(WerewolfRole.Chupacabra, WerewolfRole.Villager);
    expect(result.investigationResult?.isWerewolfTeam).toBe(false);
  });

  it("returns 'different teams' when second target is Neutral", () => {
    const result = investigate(WerewolfRole.Villager, WerewolfRole.Chupacabra);
    expect(result.investigationResult?.isWerewolfTeam).toBe(false);
  });

  it("returns 'different teams' when both targets are Neutral", () => {
    const result = investigate(
      WerewolfRole.Chupacabra,
      WerewolfRole.Chupacabra,
    );
    expect(result.investigationResult?.isWerewolfTeam).toBe(false);
  });

  it("includes the second target player name in the investigation result", () => {
    const result = investigate(WerewolfRole.Seer, WerewolfRole.Villager);
    expect(result.investigationResult?.secondTargetName).toBe("Charlie");
  });
});
