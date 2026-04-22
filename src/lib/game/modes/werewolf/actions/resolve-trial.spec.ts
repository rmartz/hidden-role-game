import { describe, it, expect } from "vitest";
import { GameStatus } from "@/lib/types";
import { WerewolfPhase, TrialVerdict, DaytimeVote, TrialPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { makePlayingGame } from "./test-helpers";

// ---------------------------------------------------------------------------
// ResolveTrial
// ---------------------------------------------------------------------------

function makeDayStateWithPendingTrial(
  defendantId: string,
  votes: { playerId: string; vote: DaytimeVote }[],
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
        phase: TrialPhase.Voting,
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
            phase: TrialPhase.Defense,
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
    it("sets pendingGuiltId when last non-Bad player receives guilty verdict", () => {
      // Guilty verdict defers death to AdvanceMartyrWindow; game stays Playing.
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p2", [
          { playerId: "p3", vote: DaytimeVote.Guilty },
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
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as { pendingGuiltId?: string };
      expect(phase.pendingGuiltId).toBe("p2");
    });

    it("sets pendingGuiltId when last Bad player receives guilty verdict", () => {
      // Guilty verdict defers death to AdvanceMartyrWindow; game stays Playing.
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p1", [
          { playerId: "p2", vote: DaytimeVote.Guilty },
          { playerId: "p3", vote: DaytimeVote.Guilty },
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
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as { pendingGuiltId?: string };
      expect(phase.pendingGuiltId).toBe("p1");
    });

    it("sets pendingGuiltId when elimination does not trigger a win condition", () => {
      // 1 bad (p1) + 3 good (p2=defendant, p3, p4) — eliminating p2 leaves 1v2, no win
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p2", [
          { playerId: "p3", vote: DaytimeVote.Guilty },
          { playerId: "p4", vote: DaytimeVote.Guilty },
        ]),
      );
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Playing);
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as { pendingGuiltId?: string };
      expect(phase.pendingGuiltId).toBe("p2");
    });

    it("Mayor vote counts double — tips a tie to guilty", () => {
      // p2 (Mayor) votes guilty, p3 votes innocent → 2 guilty vs 1 innocent → eliminated
      // Use 5 players so elimination does not trigger a win condition.
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p4", [
          { playerId: "p2", vote: DaytimeVote.Guilty },
          { playerId: "p3", vote: DaytimeVote.Innocent },
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
      expect(ts.activeTrial.verdict).toBe(TrialVerdict.Eliminated);
    });

    it("Mayor vote counts double — tips a tie to innocent", () => {
      // p2 votes guilty, p3 (Mayor) votes innocent → 1 guilty vs 2 innocent → innocent
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p4", [
          { playerId: "p2", vote: DaytimeVote.Guilty },
          { playerId: "p3", vote: DaytimeVote.Innocent },
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
      expect(ts.activeTrial.verdict).toBe(TrialVerdict.Innocent);
    });

    it("does not end game when defendant is found innocent", () => {
      // 1 bad (p1) + 2 good (p2=defendant, p3=voter) — p2 innocent, game continues
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p2", [
          { playerId: "p3", vote: DaytimeVote.Innocent },
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

    it("sets pendingGuiltId (does not yet clear One-Eyed Seer lock) when convicted player receives guilty verdict", () => {
      // The lock will be cleared in AdvanceMartyrWindow after death is applied.
      const ts = makeDayStateWithPendingTrial("p3", [
        { playerId: "p4", vote: DaytimeVote.Guilty },
        { playerId: "p5", vote: DaytimeVote.Guilty },
      ]);
      ts.oneEyedSeerLockedTargetId = "p3";
      const game = makePlayingGame(ts);
      action.apply(game, {}, "owner-1");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      const phase = result.phase as { pendingGuiltId?: string };
      expect(phase.pendingGuiltId).toBe("p3");
      // Lock is not cleared yet — cleared by AdvanceMartyrWindow
      expect(result.oneEyedSeerLockedTargetId).toBe("p3");
    });

    it("sets pendingGuiltId (does not yet consume priest ward) when convicted player receives guilty verdict", () => {
      // The ward will be consumed in AdvanceMartyrWindow after death is applied.
      const ts = makeDayStateWithPendingTrial("p3", [
        { playerId: "p4", vote: DaytimeVote.Guilty },
        { playerId: "p5", vote: DaytimeVote.Guilty },
      ]);
      ts.priestWards = { p3: "p2", p4: "p2" };
      const game = makePlayingGame(ts);
      action.apply(game, {}, "owner-1");
      const result = (game.status as { turnState: WerewolfTurnState })
        .turnState;
      const phase = result.phase as { pendingGuiltId?: string };
      expect(phase.pendingGuiltId).toBe("p3");
      // Ward not consumed yet — consumed by AdvanceMartyrWindow
      expect(result.priestWards).toEqual({ p3: "p2", p4: "p2" });
    });

    it("sets pendingGuiltId when Hunter receives guilty verdict", () => {
      // Hunter revenge and death are deferred to AdvanceMartyrWindow.
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p2", [
          { playerId: "p3", vote: DaytimeVote.Guilty },
          { playerId: "p4", vote: DaytimeVote.Guilty },
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
      const phase = ts.phase as { pendingGuiltId?: string };
      expect(phase.pendingGuiltId).toBe("p2");
      // Death not applied yet — happens in AdvanceMartyrWindow
      expect(ts.deadPlayerIds).not.toContain("p2");
      expect(ts.hunterRevengePlayerId).toBeUndefined();
    });

    it("sets pendingGuiltId when Hunter receives guilty verdict (would otherwise trigger win)", () => {
      // 1 wolf vs hunter + 1 villager → eliminating hunter = wolves win — but deferred.
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p2", [
          { playerId: "p3", vote: DaytimeVote.Guilty },
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
      expect(game.status.type).toBe(GameStatus.Playing);
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as { pendingGuiltId?: string };
      expect(phase.pendingGuiltId).toBe("p2");
    });

    it("sets pendingGuiltId when Tanner receives guilty verdict", () => {
      // Tanner win is deferred to AdvanceMartyrWindow.
      const game = makePlayingGame(
        makeDayStateWithPendingTrial("p3", [
          { playerId: "p2", vote: DaytimeVote.Guilty },
          { playerId: "p4", vote: DaytimeVote.Guilty },
        ]),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Tanner },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Playing);
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      const phase = ts.phase as { pendingGuiltId?: string };
      expect(phase.pendingGuiltId).toBe("p3");
    });

    it("sets pendingGuiltId when Executioner's target is voted out", () => {
      // Executioner win is deferred to AdvanceMartyrWindow.
      const ts = makeDayStateWithPendingTrial("p2", [
        { playerId: "p3", vote: DaytimeVote.Guilty },
        { playerId: "p4", vote: DaytimeVote.Guilty },
      ]);
      ts.executionerTargetId = "p2";
      const game = makePlayingGame(ts, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Executioner },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Playing);
      const phase = (game.status as { turnState: WerewolfTurnState }).turnState
        .phase as { pendingGuiltId?: string };
      expect(phase.pendingGuiltId).toBe("p2");
    });

    it("non-target player voted out does not trigger Executioner win", () => {
      const ts = makeDayStateWithPendingTrial("p4", [
        { playerId: "p2", vote: DaytimeVote.Guilty },
        { playerId: "p3", vote: DaytimeVote.Guilty },
      ]);
      ts.executionerTargetId = "p2";
      const game = makePlayingGame(ts, {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Executioner },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      });
      action.apply(game, {}, "owner-1");
      expect(game.status.type).toBe(GameStatus.Playing);
    });
  });
});
