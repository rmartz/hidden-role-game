import { describe, it, expect } from "vitest";
import {
  GameMode,
  GameStatus,
  ShowRolesInPlay,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import type { Game } from "@/lib/types";
import { AvalonPhase } from "../types";
import type { AvalonTurnState, AssassinationPhase } from "../types";
import { AvalonRole } from "../roles";
import { resolveAssassinationAction } from "./resolve-assassination";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const roleAssignments = [
  { playerId: "p1", roleDefinitionId: AvalonRole.Merlin },
  { playerId: "p2", roleDefinitionId: AvalonRole.LoyalServant },
  { playerId: "p3", roleDefinitionId: AvalonRole.LoyalServant },
  { playerId: "p4", roleDefinitionId: AvalonRole.MinionOfMordred },
  { playerId: "p5", roleDefinitionId: AvalonRole.Assassin },
];

const playerIds = roleAssignments.map((a) => a.playerId);

function makePlayers() {
  return playerIds.map((id) => ({
    id,
    name: `Player ${id}`,
    sessionId: `session-${id}`,
    visiblePlayers: [],
  }));
}

function makeGame(turnState: AvalonTurnState): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Avalon,
    status: { type: GameStatus.Playing, turnState },
    players: makePlayers(),
    roleAssignments,
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    timerConfig: DEFAULT_TIMER_CONFIG,
    modeConfig: { gameMode: GameMode.Avalon },
  } satisfies Game;
}

function makeAssassinationTurnState(
  phaseOverrides: Partial<AssassinationPhase> = {},
): AvalonTurnState {
  return {
    questNumber: 3,
    phase: {
      type: AvalonPhase.Assassination,
      assassinPlayerId: "p5",
      ...phaseOverrides,
    },
    leaderOrder: [...playerIds],
    currentLeaderIndex: 0,
    questResults: [],
    consecutiveRejections: 0,
    questTeamSizes: [2, 3, 2, 3, 3],
    requiresTwoFails: [],
  };
}

// ---------------------------------------------------------------------------
// resolveAssassinationAction
// ---------------------------------------------------------------------------

describe("resolveAssassinationAction", () => {
  describe("isValid", () => {
    it("valid when target is selected and assassination not yet resolved", () => {
      const game = makeGame(
        makeAssassinationTurnState({ targetPlayerId: "p1" }),
      );
      expect(resolveAssassinationAction.isValid(game, "p5", {})).toBe(true);
    });

    it("invalid when no target has been selected", () => {
      const game = makeGame(makeAssassinationTurnState());
      expect(resolveAssassinationAction.isValid(game, "p5", {})).toBe(false);
    });

    it("invalid when assassination is already resolved", () => {
      const game = makeGame(
        makeAssassinationTurnState({ targetPlayerId: "p1", correct: true }),
      );
      expect(resolveAssassinationAction.isValid(game, "p5", {})).toBe(false);
    });

    it("invalid when not in Assassination phase", () => {
      const ts: AvalonTurnState = {
        ...makeAssassinationTurnState(),
        phase: {
          type: AvalonPhase.TeamProposal,
          leaderId: "p1",
          teamSize: 2,
        },
      };
      const game = makeGame(ts);
      expect(resolveAssassinationAction.isValid(game, "p5", {})).toBe(false);
    });

    it("invalid when game is not playing", () => {
      const game: Game = {
        id: "game-1",
        lobbyId: "lobby-1",
        gameMode: GameMode.Avalon,
        status: { type: GameStatus.Starting },
        players: makePlayers(),
        roleAssignments,
        configuredRoleBuckets: [],
        showRolesInPlay: ShowRolesInPlay.None,
        timerConfig: DEFAULT_TIMER_CONFIG,
        modeConfig: { gameMode: GameMode.Avalon },
      };
      expect(resolveAssassinationAction.isValid(game, "p5", {})).toBe(false);
    });
  });

  describe("apply - correct assassination (Merlin identified)", () => {
    it("ends game with Evil winning when Merlin is the target", () => {
      // p1 is Merlin in roleAssignments
      const game = makeGame(
        makeAssassinationTurnState({ targetPlayerId: "p1" }),
      );
      resolveAssassinationAction.apply(game, {}, "p5");

      expect(game.status.type).toBe(GameStatus.Finished);
      if (game.status.type === GameStatus.Finished) {
        expect(game.status.winner).toBe("Bad");
        expect(game.status.victoryConditionKey).toBe("assassination");
      }
    });

    it("Evil wins when Merlin is targeted (correct=true path)", () => {
      const game = makeGame(
        makeAssassinationTurnState({ targetPlayerId: "p1" }),
      );
      resolveAssassinationAction.apply(game, {}, "p5");

      // Game is now Finished; verify phase was updated before status change
      // by checking that the apply ran (winner is Bad)
      expect(game.status.type).toBe(GameStatus.Finished);
      if (game.status.type === GameStatus.Finished) {
        expect(game.status.winner).toBe("Bad");
      }
    });
  });

  describe("apply - incorrect assassination (Merlin not identified)", () => {
    it("ends game with Good winning when a non-Merlin is targeted", () => {
      // p2 is LoyalServant, not Merlin
      const game = makeGame(
        makeAssassinationTurnState({ targetPlayerId: "p2" }),
      );
      resolveAssassinationAction.apply(game, {}, "p5");

      expect(game.status.type).toBe(GameStatus.Finished);
      if (game.status.type === GameStatus.Finished) {
        expect(game.status.winner).toBe("Good");
        expect(game.status.victoryConditionKey).toBe("assassination-failed");
      }
    });

    it("ends game with Good winning when the Assassin themselves is targeted", () => {
      // p5 is Assassin (Bad team), not Merlin
      const game = makeGame(
        makeAssassinationTurnState({ targetPlayerId: "p5" }),
      );
      resolveAssassinationAction.apply(game, {}, "p5");

      expect(game.status.type).toBe(GameStatus.Finished);
      if (game.status.type === GameStatus.Finished) {
        expect(game.status.winner).toBe("Good");
        expect(game.status.victoryConditionKey).toBe("assassination-failed");
      }
    });

    it("ends game with Good winning when an Evil player is targeted", () => {
      // p4 is MinionOfMordred (Bad), not Merlin
      const game = makeGame(
        makeAssassinationTurnState({ targetPlayerId: "p4" }),
      );
      resolveAssassinationAction.apply(game, {}, "p5");

      expect(game.status.type).toBe(GameStatus.Finished);
      if (game.status.type === GameStatus.Finished) {
        expect(game.status.winner).toBe("Good");
      }
    });
  });
});
