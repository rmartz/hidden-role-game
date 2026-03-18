import { describe, it, expect } from "vitest";
import { GameStatus, GameMode, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfRole } from "../roles";
import { checkWinCondition, WerewolfWinner } from "./win-condition";

function makeGame(
  roleAssignments: { playerId: string; roleDefinitionId: string }[],
): Game {
  return {
    id: "g1",
    lobbyId: "l1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing },
    players: roleAssignments.map((a, i) => ({
      id: a.playerId,
      name: a.playerId,
      sessionId: `s${String(i)}`,
      visibleRoles: [],
    })),
    roleAssignments,
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner",
    nominationsEnabled: false,
  };
}

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
  });
});
