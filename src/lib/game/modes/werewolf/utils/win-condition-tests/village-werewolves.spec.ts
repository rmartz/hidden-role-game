import { describe, expect, it } from "vitest";

import { GameStatus } from "@/lib/types";

import { WerewolfRole } from "../../roles";
import { checkWinCondition, WerewolfWinner } from "../win-condition";
import { makeGame } from "./helpers";

describe("checkWinCondition", () => {
  describe("Village wins", () => {
    it("Village wins when all Bad players are dead and no Neutral remain", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, ["p1"]);
      expect(result?.winner).toBe(WerewolfWinner.Village);
    });

    it("Village wins when all Bad are dead and a non-killer Neutral (Tanner) is still alive", () => {
      // Non-killer Neutrals (Tanner, Executioner, Dracula, Zombie) are not a threat to
      // Village win — only killer Neutrals (Chupacabra, Arsonist) delay the Village win.
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Tanner },
      ]);
      const result = checkWinCondition(game, ["p1"]);
      expect(result?.winner).toBe(WerewolfWinner.Village);
    });

    it("Village wins when all Bad are dead and an Executioner is still alive alongside Good", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Executioner },
      ]);
      const result = checkWinCondition(game, ["p1"]);
      expect(result?.winner).toBe(WerewolfWinner.Village);
    });
  });

  describe("Werewolves win", () => {
    it("Werewolves win when Bad count equals non-Bad count", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Werewolves);
    });

    it("Werewolves win when Bad count exceeds non-Bad count", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Werewolves);
    });

    it("game continues when Bad count is less than non-Bad count", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, []);
      expect(result).toBeUndefined();
    });
  });

  describe("Neutral roles in wolf-vs-village balance", () => {
    it("Tanner alive prevents wolves from winning by being uncounted", () => {
      // 1 wolf + 1 villager + 1 tanner: without counting Tanner, wolves would win (1v1)
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Tanner },
      ]);
      const result = checkWinCondition(game, []);
      expect(result).toBeUndefined();
    });

    it("Executioner alive prevents wolves from winning by being uncounted", () => {
      // 1 wolf + 1 villager + 1 executioner: without counting Executioner, wolves would win (1v1)
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Executioner },
      ]);
      const result = checkWinCondition(game, []);
      expect(result).toBeUndefined();
    });

    it("Dracula alive prevents wolves from winning by being uncounted", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Dracula },
      ]);
      const result = checkWinCondition(game, []);
      expect(result).toBeUndefined();
    });

    it("Zombie alive prevents wolves from winning by being uncounted", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Zombie },
      ]);
      const result = checkWinCondition(game, []);
      expect(result).toBeUndefined();
    });
  });

  describe("Draw", () => {
    it("draw when all players are simultaneously eliminated", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, ["p1", "p2"]);
      expect(result?.type).toBe(GameStatus.Finished);
      expect(result?.winner).toBe(WerewolfWinner.Draw);
    });

    it("draw when wolf and chupacabra both die on the same night", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Chupacabra },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      // p3 already dead; p1 and p2 kill each other this night
      const result = checkWinCondition(game, ["p3", "p1", "p2"]);
      expect(result?.winner).toBe(WerewolfWinner.Draw);
    });

    it("alive Spoiler overrides Draw result", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Spoiler },
      ]);
      // Wolf and Villager both dead — would be Draw, but Spoiler is alive
      const result = checkWinCondition(game, ["p1", "p2"]);
      expect(result?.winner).toBe(WerewolfWinner.Spoiler);
    });
  });
});
