import { describe, expect, it } from "vitest";

import { WerewolfRole } from "../../roles";
import { checkWinCondition, WerewolfWinner } from "../win-condition";
import { makeGame } from "./helpers";

describe("checkWinCondition", () => {
  describe("Lone Wolf", () => {
    it("Lone Wolf wins when only Lone Wolves remain vs non-Bad (no regular wolves)", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.LoneWolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.LoneWolf);
    });

    it("Lone Wolf wins when multiple Lone Wolves outnumber non-Bad", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.LoneWolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.LoneWolf },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.LoneWolf);
    });

    it("game continues when Lone Wolf alone is outnumbered by non-Bad", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.LoneWolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, []);
      expect(result).toBeUndefined();
    });

    it("regular Werewolves win when both regular wolf and Lone Wolf are alive and meet threshold", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.LoneWolf },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Werewolves);
    });

    it("Lone Wolf alone does not trigger regular Werewolves win", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.LoneWolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, []);
      expect(result?.winner).not.toBe(WerewolfWinner.Werewolves);
    });
  });

  describe("Spoiler", () => {
    it("alive Spoiler overrides Village win", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Spoiler },
      ]);
      // Werewolf dead → Village would normally win, but Spoiler is alive
      const result = checkWinCondition(game, ["p1"]);
      expect(result?.winner).toBe(WerewolfWinner.Spoiler);
    });

    it("alive Spoiler overrides Werewolf win", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Spoiler },
      ]);
      // Werewolves >= non-Bad → Werewolves would normally win, but Spoiler is alive
      const result = checkWinCondition(game, ["p2"]);
      expect(result?.winner).toBe(WerewolfWinner.Spoiler);
    });

    it("dead Spoiler does not affect outcome", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Spoiler },
      ]);
      // Spoiler is dead; Werewolf dead → Village wins normally
      const result = checkWinCondition(game, ["p1", "p3"]);
      expect(result?.winner).toBe(WerewolfWinner.Village);
    });
  });

  describe("Illuminati", () => {
    it("Illuminati wins when alive and ≤3 players remain during a wolf win", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Illuminati },
      ]);
      // 1 wolf + 1 illuminati: wolves would win (1 bad >= 1 non-bad), but Illuminati is alive with ≤3
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Illuminati);
    });

    it("Illuminati wins when alive and ≤3 players remain during a village win", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Illuminati },
      ]);
      // Wolf dead → Village wins, but Illuminati is alive with ≤3 remaining
      const result = checkWinCondition(game, ["p1"]);
      expect(result?.winner).toBe(WerewolfWinner.Illuminati);
    });

    it("Illuminati does not win when more than 3 players are alive", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Illuminati },
      ]);
      // 2 wolves + 1 villager + 1 illuminati = 4 alive: wolves win (2 bad >= 2 non-bad)
      // but 4 > 3, so Illuminati does NOT override
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Werewolves);
    });

    it("dead Illuminati does not affect outcome", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Illuminati },
      ]);
      // Illuminati is dead; Wolf dead → Village wins normally
      const result = checkWinCondition(game, ["p1", "p3"]);
      expect(result?.winner).toBe(WerewolfWinner.Village);
    });

    it("Illuminati counts as neutral and prevents premature wolf win", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Illuminati },
      ]);
      // 1 wolf vs 1 villager + 1 illuminati: wolves do NOT win yet (1 < 2)
      const result = checkWinCondition(game, []);
      expect(result).toBeUndefined();
    });

    it("Illuminati wins over Spoiler when both are alive and ≤3 remain", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Illuminati },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Spoiler },
      ]);
      // Wolf wins (1 bad >= 1 non-bad with only Illuminati as neutral), 3 players alive
      // Illuminati override fires before Spoiler
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Illuminati);
    });
  });
});
