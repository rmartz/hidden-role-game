import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { DEFAULT_TIMER_CONFIG } from "@/lib/types";
import { ClocktowerAction, CLOCKTOWER_ACTIONS } from "./index";
import { ClocktowerRole } from "../roles";
import { makePlayingGame, makeNightTurnState } from "./test-helpers";

const action = CLOCKTOWER_ACTIONS[ClocktowerAction.ResolveNight];

describe("ClocktowerAction.ResolveNight", () => {
  describe("isValid", () => {
    it("allows the owner to resolve the night", () => {
      const game = makePlayingGame(makeNightTurnState());
      expect(action.isValid(game, "owner-1", {})).toBe(true);
    });

    it("returns false for non-owner callers", () => {
      const game = makePlayingGame(makeNightTurnState());
      expect(action.isValid(game, "p1", {})).toBe(false);
    });

    it("returns false when game is not in Playing status", () => {
      const game = makePlayingGame(makeNightTurnState(), {
        status: { type: GameStatus.Finished, winner: undefined },
      });
      expect(action.isValid(game, "owner-1", {})).toBe(false);
    });
  });

  describe("apply — Imp kill", () => {
    it("adds the Imp's target to deadPlayerIds", () => {
      const fixture = makeNightTurnState({
        nightActions: { [ClocktowerRole.Imp]: { targetPlayerId: "p3" } },
      });
      const game = makePlayingGame(fixture);
      action.apply(game, {}, "owner-1");
      expect(fixture.ts.deadPlayerIds).toContain("p3");
    });

    it("does not add the target twice if already dead", () => {
      const fixture = makeNightTurnState({
        deadPlayerIds: ["p3"],
        nightActions: { [ClocktowerRole.Imp]: { targetPlayerId: "p3" } },
      });
      const game = makePlayingGame(fixture);
      action.apply(game, {}, "owner-1");
      expect(fixture.ts.deadPlayerIds.filter((id) => id === "p3")).toHaveLength(
        1,
      );
    });

    it("does not kill anyone when the Imp has no target", () => {
      const fixture = makeNightTurnState();
      const game = makePlayingGame(fixture);
      action.apply(game, {}, "owner-1");
      expect(fixture.ts.deadPlayerIds).toHaveLength(0);
    });
  });

  describe("apply — Monk protection", () => {
    it("does not kill the Monk's protected player", () => {
      const fixture = makeNightTurnState({
        nightActions: {
          [ClocktowerRole.Imp]: { targetPlayerId: "p3" },
          [ClocktowerRole.Monk]: { targetPlayerId: "p3" },
        },
      });
      const game = makePlayingGame(fixture);
      action.apply(game, {}, "owner-1");
      expect(fixture.ts.deadPlayerIds).not.toContain("p3");
    });

    it("kills a different player even when Monk is in play", () => {
      const fixture = makeNightTurnState({
        nightActions: {
          [ClocktowerRole.Imp]: { targetPlayerId: "p4" },
          [ClocktowerRole.Monk]: { targetPlayerId: "p3" },
        },
      });
      const game = makePlayingGame(fixture);
      action.apply(game, {}, "owner-1");
      expect(fixture.ts.deadPlayerIds).toContain("p4");
    });
  });

  describe("apply — Soldier immunity", () => {
    it("does not kill a Soldier targeted by the Imp", () => {
      const fixture = makeNightTurnState({
        nightActions: { [ClocktowerRole.Imp]: { targetPlayerId: "p3" } },
      });
      const game = makePlayingGame(fixture, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: ClocktowerRole.Imp },
          { playerId: "p2", roleDefinitionId: ClocktowerRole.Poisoner },
          { playerId: "p3", roleDefinitionId: ClocktowerRole.Soldier },
          { playerId: "p4", roleDefinitionId: ClocktowerRole.Empath },
          { playerId: "p5", roleDefinitionId: ClocktowerRole.Monk },
        ],
      });
      action.apply(game, {}, "owner-1");
      expect(fixture.ts.deadPlayerIds).not.toContain("p3");
    });
  });

  describe("apply — Imp self-kill", () => {
    it("kills the Imp and transfers Demon status to a Minion", () => {
      const fixture = makeNightTurnState({
        demonPlayerId: "p1",
        nightActions: { [ClocktowerRole.Imp]: { targetPlayerId: "p1" } },
      });
      const game = makePlayingGame(fixture, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: ClocktowerRole.Imp },
          { playerId: "p2", roleDefinitionId: ClocktowerRole.Poisoner },
          { playerId: "p3", roleDefinitionId: ClocktowerRole.Empath },
          { playerId: "p4", roleDefinitionId: ClocktowerRole.Washerwoman },
          { playerId: "p5", roleDefinitionId: ClocktowerRole.Mayor },
        ],
      });
      action.apply(game, {}, "owner-1");
      expect(fixture.ts.deadPlayerIds).toContain("p1");
      expect(fixture.ts.demonPlayerId).toBe("p2");
    });

    it("uses Scarlet Woman when 5+ players alive", () => {
      const fixture = makeNightTurnState({
        demonPlayerId: "p1",
        nightActions: { [ClocktowerRole.Imp]: { targetPlayerId: "p1" } },
      });
      const game: Game = {
        id: "game-1",
        lobbyId: "lobby-1",
        gameMode: GameMode.Clocktower,
        status: { type: GameStatus.Playing, turnState: fixture.ts },
        players: [
          { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
          { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
          { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
          { id: "p4", name: "Dave", sessionId: "s4", visiblePlayers: [] },
          { id: "p5", name: "Eve", sessionId: "s5", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: ClocktowerRole.Imp },
          { playerId: "p2", roleDefinitionId: ClocktowerRole.Poisoner },
          { playerId: "p3", roleDefinitionId: ClocktowerRole.ScarletWoman },
          { playerId: "p4", roleDefinitionId: ClocktowerRole.Empath },
          { playerId: "p5", roleDefinitionId: ClocktowerRole.Monk },
        ],
        configuredRoleBuckets: [],
        showRolesInPlay: ShowRolesInPlay.None,
        ownerPlayerId: "owner-1",
        modeConfig: { gameMode: GameMode.Clocktower },
        timerConfig: DEFAULT_TIMER_CONFIG,
      } as Game;
      action.apply(game, {}, "owner-1");
      expect(fixture.ts.deadPlayerIds).toContain("p1");
      expect(fixture.ts.demonPlayerId).toBe("p3");
    });
  });

  describe("apply — Poisoner", () => {
    it("sets poisonedPlayerId from the Poisoner's action", () => {
      const fixture = makeNightTurnState({
        nightActions: {
          [ClocktowerRole.Poisoner]: { targetPlayerId: "p4" },
        },
      });
      const game = makePlayingGame(fixture);
      action.apply(game, {}, "owner-1");
      expect(fixture.ts.poisonedPlayerId).toBe("p4");
    });

    it("clears poisonedPlayerId when Poisoner has no action", () => {
      const fixture = makeNightTurnState({ poisonedPlayerId: "p4" });
      const game = makePlayingGame(fixture);
      action.apply(game, {}, "owner-1");
      expect(fixture.ts.poisonedPlayerId).toBeUndefined();
    });
  });

  describe("apply — currentActionIndex", () => {
    it("advances currentActionIndex by 1", () => {
      const fixture = makeNightTurnState({ currentActionIndex: 3 });
      const game = makePlayingGame(fixture);
      action.apply(game, {}, "owner-1");
      expect(fixture.phase.currentActionIndex).toBe(4);
    });
  });
});
