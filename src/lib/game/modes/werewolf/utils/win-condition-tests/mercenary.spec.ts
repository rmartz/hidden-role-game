import { describe, expect, it } from "vitest";

import { WerewolfRole } from "../../roles";
import { checkWinCondition, WerewolfWinner } from "../win-condition";
import { makeDayTurnState, makeGame } from "./helpers";

describe("checkWinCondition", () => {
  describe("Mercenary win condition", () => {
    it("Mercenary alive prevents wolves from winning by being uncounted", () => {
      // 1 wolf + 1 villager + 1 mercenary: Mercenary counts as neutral, wolves don't win yet
      const game = makeGame([
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Mercenary },
      ]);
      const result = checkWinCondition(game, []);
      expect(result).toBeUndefined();
    });

    it("Mercenary co-wins when Village wins and a bribed Good player is alive", () => {
      const game = makeGame(
        [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mercenary },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
        makeDayTurnState({
          roleState: { mercenary: { charged: false, bribedPlayerIds: ["p3"] } },
          deadPlayerIds: [],
        }),
      );
      // Wolf dead → Village wins; Mercenary alive with bribed Good player alive → co-win
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Village);
      expect(result?.victoryConditionKey).toBe(WerewolfWinner.Mercenary);
    });

    it("Mercenary co-wins when Werewolves win and a bribed Bad player is alive", () => {
      const game = makeGame(
        [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mercenary },
        ],
        makeDayTurnState({
          roleState: { mercenary: { charged: false, bribedPlayerIds: ["p1"] } },
          deadPlayerIds: [],
        }),
      );
      // 1 wolf, 1 neutral Mercenary — wolves outnumber non-bad → wolves win; Mercenary co-wins
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Werewolves);
      expect(result?.victoryConditionKey).toBe(WerewolfWinner.Mercenary);
    });

    it("Mercenary does not win when bribed player is dead", () => {
      const game = makeGame(
        [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mercenary },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
        makeDayTurnState({
          roleState: { mercenary: { charged: false, bribedPlayerIds: ["p3"] } },
          deadPlayerIds: [],
        }),
      );
      // Wolf dead → Village wins; but bribed player p3 is dead → Mercenary doesn't win
      const result = checkWinCondition(game, ["p3"]);
      expect(result?.winner).toBe(WerewolfWinner.Village);
      expect(result?.victoryConditionKey).toBeUndefined();
    });

    it("Mercenary does not win when they have no bribed players", () => {
      const game = makeGame(
        [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mercenary },
        ],
        makeDayTurnState({ deadPlayerIds: [] }),
      );
      // Wolf dead → Village wins; but Mercenary has no bribed players → no win
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Village);
    });

    it("Mercenary does not win when they are dead", () => {
      const game = makeGame(
        [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mercenary },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
        makeDayTurnState({
          roleState: { mercenary: { charged: false, bribedPlayerIds: ["p3"] } },
          deadPlayerIds: ["p2"],
        }),
      );
      // Wolf dead → Village wins; Mercenary dead → Mercenary doesn't win
      const result = checkWinCondition(game, ["p2"]);
      expect(result?.winner).toBe(WerewolfWinner.Village);
    });

    it("Mercenary does not win when bribed player is on wrong team", () => {
      const game = makeGame(
        [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mercenary },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Tanner },
        ],
        makeDayTurnState({
          roleState: { mercenary: { charged: false, bribedPlayerIds: ["p3"] } },
          deadPlayerIds: [],
        }),
      );
      // Wolf dead → Village wins (p3 Tanner is neutral, not Team.Good) → Mercenary doesn't win
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Village);
    });

    it("Spoiler wins alone when Spoiler is alive and bribed player is not the Spoiler", () => {
      const game = makeGame(
        [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mercenary },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Spoiler },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        ],
        makeDayTurnState({
          roleState: { mercenary: { charged: false, bribedPlayerIds: ["p4"] } },
          deadPlayerIds: [],
        }),
      );
      // Village wins; Spoiler alive → Spoiler wins; Mercenary bribed p4 (Villager, not Spoiler) → no co-win
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Spoiler);
      expect(result?.victoryConditionKey).toBeUndefined();
    });

    it("Mercenary co-wins with Spoiler when Spoiler is bribed and alive", () => {
      const game = makeGame(
        [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mercenary },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Spoiler },
        ],
        makeDayTurnState({
          roleState: { mercenary: { charged: false, bribedPlayerIds: ["p3"] } },
          deadPlayerIds: [],
        }),
      );
      // Village wins; Spoiler alive → Spoiler wins; Mercenary bribed the Spoiler → co-win
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Spoiler);
      expect(result?.victoryConditionKey).toBe(WerewolfWinner.Mercenary);
    });

    it("Mercenary co-wins with Illuminati when Illuminati is bribed and alive", () => {
      const game = makeGame(
        [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mercenary },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Illuminati },
        ],
        makeDayTurnState({
          roleState: { mercenary: { charged: false, bribedPlayerIds: ["p3"] } },
          deadPlayerIds: [],
        }),
      );
      // ≤3 players, win fires → Illuminati wins; Mercenary bribed the Illuminati → co-win
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Illuminati);
      expect(result?.victoryConditionKey).toBe(WerewolfWinner.Mercenary);
    });

    it("Mercenary co-wins with Lone Wolf when Lone Wolf is bribed and alive", () => {
      const game = makeGame(
        [
          { playerId: "p1", roleDefinitionId: WerewolfRole.LoneWolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mercenary },
        ],
        makeDayTurnState({
          roleState: { mercenary: { charged: false, bribedPlayerIds: ["p1"] } },
          deadPlayerIds: [],
        }),
      );
      // Lone Wolf wins; Mercenary bribed the Lone Wolf → co-win
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.LoneWolf);
      expect(result?.victoryConditionKey).toBe(WerewolfWinner.Mercenary);
    });

    it("Mercenary does not co-win on Lone Wolf victory when bribed player is dead", () => {
      const game = makeGame(
        [
          { playerId: "p1", roleDefinitionId: WerewolfRole.LoneWolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mercenary },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
        makeDayTurnState({
          roleState: { mercenary: { charged: false, bribedPlayerIds: ["p3"] } },
          deadPlayerIds: ["p3"],
        }),
      );
      // Lone Wolf wins (only Bad is LoneWolf, matches Mercenary neutral); bribed p3 is dead → no co-win
      const result = checkWinCondition(game, ["p3"]);
      expect(result?.winner).toBe(WerewolfWinner.LoneWolf);
      expect(result?.victoryConditionKey).toBeUndefined();
    });

    it("Mercenary co-wins with Zombie when the Zombie is bribed and wins", () => {
      // p1=Zombie, p2=Villager(infected), p3=Villager(infected), p4=Mercenary
      // infected(2) > healthy(0) → Zombie wins; Mercenary bribed Zombie → co-win
      const game = makeGame(
        [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Zombie },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Mercenary },
        ],
        makeDayTurnState({
          roleState: {
            zombie: { infected: ["p2", "p3"] },
            mercenary: { charged: false, bribedPlayerIds: ["p1"] },
          },
          deadPlayerIds: [],
        }),
      );
      const result = checkWinCondition(game, []);
      expect(result?.winner).toBe(WerewolfWinner.Zombie);
      expect(result?.victoryConditionKey).toBe(WerewolfWinner.Mercenary);
    });

    it("Mercenary co-wins with Arsonist when the Arsonist is bribed and wins", () => {
      // p1=Arsonist, p2=Mercenary; Bad dead → Arsonist wins (≤1 Good remains);
      // Mercenary bribed the Arsonist → co-win
      const game = makeGame(
        [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Arsonist },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Mercenary },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        ],
        makeDayTurnState({
          roleState: { mercenary: { charged: false, bribedPlayerIds: ["p1"] } },
          deadPlayerIds: ["p3"],
        }),
      );
      // Arsonist + Mercenary remain; ≤1 Good (p3 dead) → Arsonist wins; Mercenary bribed Arsonist → co-win
      const result = checkWinCondition(game, ["p3"]);
      expect(result?.winner).toBe(WerewolfWinner.Arsonist);
      expect(result?.victoryConditionKey).toBe(WerewolfWinner.Mercenary);
    });
  });
});
