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
import { selectAssassinationTargetAction } from "./select-assassination-target";

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

function getTurnState(game: Game): AvalonTurnState {
  if (game.status.type !== GameStatus.Playing) throw new Error("Not playing");
  return game.status.turnState as AvalonTurnState;
}

// ---------------------------------------------------------------------------
// selectAssassinationTargetAction
// ---------------------------------------------------------------------------

describe("selectAssassinationTargetAction", () => {
  describe("isValid", () => {
    it("Assassin can select a valid target", () => {
      const game = makeGame(makeAssassinationTurnState());
      expect(
        selectAssassinationTargetAction.isValid(game, "p5", {
          targetPlayerId: "p1",
        }),
      ).toBe(true);
    });

    it("Assassin can change their target before resolution", () => {
      const game = makeGame(
        makeAssassinationTurnState({ targetPlayerId: "p2" }),
      );
      expect(
        selectAssassinationTargetAction.isValid(game, "p5", {
          targetPlayerId: "p1",
        }),
      ).toBe(true);
    });

    it("non-Assassin cannot select a target", () => {
      const game = makeGame(makeAssassinationTurnState());
      expect(
        selectAssassinationTargetAction.isValid(game, "p1", {
          targetPlayerId: "p2",
        }),
      ).toBe(false);
    });

    it("rejects after assassination is resolved", () => {
      const game = makeGame(
        makeAssassinationTurnState({ targetPlayerId: "p1", correct: true }),
      );
      expect(
        selectAssassinationTargetAction.isValid(game, "p5", {
          targetPlayerId: "p2",
        }),
      ).toBe(false);
    });

    it("rejects unknown player ID as target", () => {
      const game = makeGame(makeAssassinationTurnState());
      expect(
        selectAssassinationTargetAction.isValid(game, "p5", {
          targetPlayerId: "unknown",
        }),
      ).toBe(false);
    });

    it("rejects non-string targetPlayerId", () => {
      const game = makeGame(makeAssassinationTurnState());
      expect(
        selectAssassinationTargetAction.isValid(game, "p5", {
          targetPlayerId: 123,
        }),
      ).toBe(false);
    });

    it("rejects when not in Assassination phase", () => {
      const ts: AvalonTurnState = {
        ...makeAssassinationTurnState(),
        phase: {
          type: AvalonPhase.TeamProposal,
          leaderId: "p1",
          teamSize: 2,
        },
      };
      const game = makeGame(ts);
      expect(
        selectAssassinationTargetAction.isValid(game, "p5", {
          targetPlayerId: "p1",
        }),
      ).toBe(false);
    });

    it("rejects when game is not playing", () => {
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
      expect(
        selectAssassinationTargetAction.isValid(game, "p5", {
          targetPlayerId: "p1",
        }),
      ).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets targetPlayerId on the assassination phase", () => {
      const game = makeGame(makeAssassinationTurnState());
      selectAssassinationTargetAction.apply(
        game,
        { targetPlayerId: "p1" },
        "p5",
      );

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(AvalonPhase.Assassination);
      if (ts.phase.type === AvalonPhase.Assassination) {
        expect(ts.phase.targetPlayerId).toBe("p1");
      }
    });

    it("updates targetPlayerId when Assassin changes their selection", () => {
      const game = makeGame(
        makeAssassinationTurnState({ targetPlayerId: "p2" }),
      );
      selectAssassinationTargetAction.apply(
        game,
        { targetPlayerId: "p3" },
        "p5",
      );

      const ts = getTurnState(game);
      if (ts.phase.type === AvalonPhase.Assassination) {
        expect(ts.phase.targetPlayerId).toBe("p3");
      }
    });

    it("does not end the game", () => {
      const game = makeGame(makeAssassinationTurnState());
      selectAssassinationTargetAction.apply(
        game,
        { targetPlayerId: "p1" },
        "p5",
      );

      expect(game.status.type).toBe(GameStatus.Playing);
    });
  });
});
