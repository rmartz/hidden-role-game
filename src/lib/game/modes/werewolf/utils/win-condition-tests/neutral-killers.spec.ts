import { describe, expect, it } from "vitest";

import { WerewolfRole } from "../../roles";
import { checkWinCondition, WerewolfWinner } from "../win-condition";
import { makeDayTurnState, makeGame } from "./helpers";

describe("checkWinCondition", () => {
  describe("Chupacabra", () => {
    it("Chupacabra wins when all Bad are dead and ≤1 Good remains", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Chupacabra },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, ["p1"]);
      expect(result?.winner).toBe(WerewolfWinner.Chupacabra);
    });

    it("Chupacabra wins when all Bad are dead and 0 Good remain", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Chupacabra },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, ["p1", "p3"]);
      expect(result?.winner).toBe(WerewolfWinner.Chupacabra);
    });

    it("game continues when Chupacabra is alive and >1 Good remain", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Chupacabra },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, ["p1"]);
      expect(result).toBeUndefined();
    });

    it("game continues when Bad and Chupacabra are the only survivors (conflicting win conditions)", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Chupacabra },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      // p3 (Good) is dead — only wolf vs chupacabra remain
      const result = checkWinCondition(game, ["p3"]);
      expect(result).toBeUndefined();
    });

    it("game continues with multiple Bad vs single Chupacabra and no Good", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Chupacabra },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      ]);
      // p4 (Good) is dead — 2 wolves vs chupacabra
      const result = checkWinCondition(game, ["p4"]);
      expect(result).toBeUndefined();
    });

    it("Village does not win while Chupacabra is alive (with Good players remaining)", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Chupacabra },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, ["p1"]);
      expect(result?.winner).not.toBe(WerewolfWinner.Village);
    });
  });

  describe("Zombie", () => {
    it("Zombie wins when infected alive outnumber healthy alive", () => {
      // zombie + p1 (infected) + p2 (infected) + p3 (healthy): 2 infected > 1 healthy
      const ts = makeDayTurnState({
        roleState: { zombie: { infected: ["p1", "p2"] } },
      });
      const game = makeGame(
        [
          { playerId: "zombie", roleDefinitionId: WerewolfRole.Zombie },
          { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
        ts,
      );
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Zombie);
    });

    it("game continues when infected equals healthy", () => {
      const ts = makeDayTurnState({
        roleState: { zombie: { infected: ["p1"] } },
      });
      const game = makeGame(
        [
          { playerId: "zombie", roleDefinitionId: WerewolfRole.Zombie },
          { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        ],
        ts,
      );
      const result = checkWinCondition(game, []);
      expect(result?.winner).not.toBe(WerewolfWinner.Zombie);
    });

    it("Zombie does not win when dead", () => {
      const ts = makeDayTurnState({
        roleState: { zombie: { infected: ["p1", "p2"] } },
      });
      const game = makeGame(
        [
          { playerId: "zombie", roleDefinitionId: WerewolfRole.Zombie },
          { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
        ts,
      );
      const result = checkWinCondition(game, ["zombie"]);
      expect(result?.winner).not.toBe(WerewolfWinner.Zombie);
    });

    it("dead infected players are not counted for Zombie win", () => {
      // zombie + p1 (infected, dead) + p2 (infected) + p3 (healthy)
      // alive: 1 infected vs 1 healthy → no win
      const ts = makeDayTurnState({
        roleState: { zombie: { infected: ["p1", "p2"] } },
      });
      const game = makeGame(
        [
          { playerId: "zombie", roleDefinitionId: WerewolfRole.Zombie },
          { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
        ts,
      );
      const result = checkWinCondition(game, ["p1"]);
      expect(result?.winner).not.toBe(WerewolfWinner.Zombie);
    });
  });

  describe("Arsonist", () => {
    it("Arsonist wins when all Bad are dead and ≤1 Good remains", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Arsonist },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, ["p1"]);
      expect(result?.winner).toBe(WerewolfWinner.Arsonist);
    });

    it("Arsonist wins when all Bad are dead and 0 Good remain", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Arsonist },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, ["p1", "p3"]);
      expect(result?.winner).toBe(WerewolfWinner.Arsonist);
    });

    it("game continues when Arsonist is alive and >1 Good remain", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Arsonist },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      ]);
      const result = checkWinCondition(game, ["p1"]);
      expect(result).toBeUndefined();
    });

    it("game continues when Bad and Arsonist are the only survivors", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Arsonist },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      // Only wolf and arsonist remain — conflicting win conditions
      const result = checkWinCondition(game, ["p3"]);
      expect(result).toBeUndefined();
    });

    it("game continues when both Arsonist and Chupacabra are alive with ≤1 Good", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Arsonist },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Chupacabra },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      ]);
      // Wolf dead, both neutral killers alive with 1 Good — neither can win yet
      const result = checkWinCondition(game, ["p1"]);
      expect(result).toBeUndefined();
    });

    it("Arsonist counts as a non-Bad threat for Werewolf win condition", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Arsonist },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ]);
      // 1 wolf vs 1 arsonist + 1 villager: wolves do NOT win (1 < 2)
      const result = checkWinCondition(game, []);
      expect(result).toBeUndefined();
    });

    it("Village does not win while Arsonist is alive", () => {
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Arsonist },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      ]);
      // Wolf dead, Arsonist + 2 Good remain — Arsonist still has >1 Good to overcome, game continues
      const result = checkWinCondition(game, ["p1"]);
      expect(result).toBeUndefined();
    });
  });
});
