import { describe, it, expect } from "vitest";
import { GameStatus } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { WerewolfWinner } from "../utils/win-condition";
import { makePlayingGame } from "./test-helpers";

// ---------------------------------------------------------------------------
// ResolveTrial
// ---------------------------------------------------------------------------

function makeDayStateWithPendingTrial(
  defendantId: string,
  votes: { playerId: string; vote: "guilty" | "innocent" }[],
  deadPlayerIds: string[] = [],
): WerewolfTurnState {
  return {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      activeTrial: {
        defendantId,
        startedAt: 2000,
        phase: "voting" as const,
        votes,
      },
    },
    deadPlayerIds,
  };
}

describe("WerewolfAction.ResolveTrial", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.ResolveTrial];

  describe("isValid", () => {
    it("returns false during defense phase", () => {
      const ts: WerewolfTurnState = {
        turn: 1,
        phase: {
          type: WerewolfPhase.Daytime,
          startedAt: 1000,
          nightActions: {},
          activeTrial: {
            defendantId: "p1",
            startedAt: 2000,
            phase: "defense",
            votes: [],
          },
        },
        deadPlayerIds: [],
      };
      const game = makePlayingGame(ts);
      expect(action.isValid(game, "owner-1", {})).toBe(false);
    });
  });

  describe("win condition after elimination", () => {
    it("Werewolves win when last non-Bad player is eliminated by trial", () => {
      // 1 bad (p1) + 2 good (p2=defendant, p3=voter)
      // p2 gets guilty verdict → 1 bad vs 1 good → Werewolves win
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p2", [
          { playerId: "p3", vote: "guilty" },
        ]),
        {
          players: [
            { id: "p1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
            { id: "p2", name: "Seer", sessionId: "s2", visiblePlayers: [] },
            { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
          ],
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Finished);
      expect((game.status as { winner?: string }).winner).toBe(
        WerewolfWinner.Werewolves,
      );
    });

    it("Village wins when last Bad player is eliminated by trial", () => {
      // 2 good (p2, p3) + 1 bad (p1=defendant)
      // p1 gets guilty verdict → 2 good remain → Village wins
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p1", [
          { playerId: "p2", vote: "guilty" },
          { playerId: "p3", vote: "guilty" },
        ]),
        {
          players: [
            { id: "p1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
            { id: "p2", name: "Seer", sessionId: "s2", visiblePlayers: [] },
            { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
          ],
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Finished);
      expect((game.status as { winner?: string }).winner).toBe(
        WerewolfWinner.Village,
      );
    });

    it("does not end game when elimination does not trigger a win condition", () => {
      // 1 bad (p1) + 3 good (p2=defendant, p3, p4) — eliminating p2 leaves 1v2, no win
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p2", [
          { playerId: "p3", vote: "guilty" },
          { playerId: "p4", vote: "guilty" },
        ]),
      );
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Playing);
    });

    it("Mayor vote counts double — tips a tie to guilty", () => {
      // p2 (Mayor) votes guilty, p3 votes innocent → 2 guilty vs 1 innocent → eliminated
      // Use 5 players so elimination does not trigger a win condition.
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p4", [
          { playerId: "p2", vote: "guilty" },
          { playerId: "p3", vote: "innocent" },
        ]),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Mayor },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, {}, "owner-1");
      const ts = (
        game.status as {
          turnState: {
            phase: { activeTrial: { verdict?: string } };
          };
        }
      ).turnState.phase;
      expect(ts.activeTrial.verdict).toBe("eliminated");
    });

    it("Mayor vote counts double — tips a tie to innocent", () => {
      // p2 votes guilty, p3 (Mayor) votes innocent → 1 guilty vs 2 innocent → innocent
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p4", [
          { playerId: "p2", vote: "guilty" },
          { playerId: "p3", vote: "innocent" },
        ]),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Mayor },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, {}, "owner-1");
      const ts = (
        game.status as {
          turnState: {
            phase: { activeTrial: { verdict?: string } };
          };
        }
      ).turnState.phase;
      expect(ts.activeTrial.verdict).toBe("innocent");
    });

    it("does not end game when defendant is found innocent", () => {
      // 1 bad (p1) + 2 good (p2=defendant, p3=voter) — p2 innocent, game continues
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p2", [
          { playerId: "p3", vote: "innocent" },
        ]),
        {
          players: [
            { id: "p1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
            { id: "p2", name: "Seer", sessionId: "s2", visiblePlayers: [] },
            { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
          ],
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Playing);
    });

    it("clears One-Eyed Seer lock when locked target is eliminated by trial", () => {
      const ts = makeDayStateWithPendingTrial("p3", [
        { playerId: "p4", vote: "guilty" },
        { playerId: "p5", vote: "guilty" },
      ]);
      ts.oneEyedSeerLockedTargetId = "p3";
      const game = makePlayingGame(ts);
      action.apply(game, {}, "owner-1");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      expect(result.oneEyedSeerLockedTargetId).toBeUndefined();
    });

    it("consumes priest ward when warded player is eliminated by trial", () => {
      const ts = makeDayStateWithPendingTrial("p3", [
        { playerId: "p4", vote: "guilty" },
        { playerId: "p5", vote: "guilty" },
      ]);
      ts.priestWards = { p3: "p2", p4: "p2" };
      const game = makePlayingGame(ts);
      action.apply(game, {}, "owner-1");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      expect(result.priestWards).toEqual({ p4: "p2" });
    });

    it("sets hunterRevengePlayerId when Hunter is eliminated by trial", () => {
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p2", [
          { playerId: "p3", vote: "guilty" },
          { playerId: "p4", vote: "guilty" },
        ]),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Playing);
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.hunterRevengePlayerId).toBe("p2");
      expect(ts.deadPlayerIds).toContain("p2");
    });

    it("defers win condition when Hunter is eliminated at trial (would otherwise trigger win)", () => {
      // 1 wolf vs hunter + 1 villager → eliminating hunter = 1 wolf vs 1 villager = wolves win
      // But hunter revenge should defer the check
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p2", [
          { playerId: "p3", vote: "guilty" },
        ]),
        {
          players: [
            { id: "p1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
            { id: "p2", name: "Hunter", sessionId: "s2", visiblePlayers: [] },
            { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
          ],
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, {}, "owner-1");
      // Game should still be playing — not finished
      expect(game.status.type).toBe(GameStatus.Playing);
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.hunterRevengePlayerId).toBe("p2");
    });
  });
});

// ---------------------------------------------------------------------------
// ResolveHunterRevenge
// ---------------------------------------------------------------------------

describe("WerewolfAction.ResolveHunterRevenge", () => {
  const resolveRevenge = WEREWOLF_ACTIONS[WerewolfAction.ResolveHunterRevenge];

  function makeDayWithHunterRevenge(): WerewolfTurnState {
    return {
      turn: 2,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: ["p2"],
      hunterRevengePlayerId: "p2",
    };
  }

  it("isValid returns true when hunterRevengePlayerId is set and target is alive", () => {
    const game = makePlayingGame(makeDayWithHunterRevenge(), {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    expect(
      resolveRevenge.isValid(game, "owner-1", { targetPlayerId: "p3" }),
    ).toBe(true);
  });

  it("isValid returns false when targeting a dead player", () => {
    const game = makePlayingGame(makeDayWithHunterRevenge(), {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    // p2 is already dead
    expect(
      resolveRevenge.isValid(game, "owner-1", { targetPlayerId: "p2" }),
    ).toBe(false);
  });

  it("kills target, clears hunterRevengePlayerId, and checks win condition", () => {
    const game = makePlayingGame(makeDayWithHunterRevenge(), {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    resolveRevenge.apply(game, { targetPlayerId: "p3" }, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).toContain("p3");
    expect(ts.hunterRevengePlayerId).toBeUndefined();
  });

  it("Hunter revenge on the last wolf triggers Village win", () => {
    const game = makePlayingGame(makeDayWithHunterRevenge(), {
      players: [
        { id: "p1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
        { id: "p2", name: "Hunter", sessionId: "s2", visiblePlayers: [] },
        { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
      ],
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    resolveRevenge.apply(game, { targetPlayerId: "p1" }, "owner-1");
    expect(game.status.type).toBe(GameStatus.Finished);
    expect((game.status as { winner?: string }).winner).toBe(
      WerewolfWinner.Village,
    );
  });
});
