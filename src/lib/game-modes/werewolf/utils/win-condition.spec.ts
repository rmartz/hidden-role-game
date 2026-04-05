import { describe, it, expect } from "vitest";
import { GameStatus, GameMode, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../timer-config";
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
      visiblePlayers: [],
    })),
    roleAssignments,
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner",
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: false,
      singleTrialPerDay: true,
      revealProtections: true,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
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
  });
});
