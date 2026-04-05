import { describe, it, expect } from "vitest";
import { presidentDrawAction } from "./president-draw";
import { SecretVillainPhase, PolicyCard, SvBoardPreset } from "../types";
import type { SecretVillainTurnState } from "../types";
import {
  GameMode,
  GameStatus,
  ShowRolesInPlay,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import type { Game } from "@/lib/types";

const baseTurnState: SecretVillainTurnState = {
  turn: 1,
  phase: {
    type: SecretVillainPhase.PolicyPresident,
    startedAt: Date.now(),
    presidentId: "p1",
    chancellorId: "p2",
    drawnCards: [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Bad],
  },
  presidentOrder: ["p1", "p2"],
  currentPresidentIndex: 0,
  goodCardsPlayed: 0,
  badCardsPlayed: 0,
  deck: [],
  discardPile: [],
  eliminatedPlayerIds: [],
  failedElectionCount: 0,
  boardPreset: SvBoardPreset.Medium,
};

function makeGame(ts: SecretVillainTurnState): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: { type: GameStatus.Playing, turnState: ts },
    players: [
      { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: "good" },
      { playerId: "p2", roleDefinitionId: "bad" },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: undefined,
    timerConfig: DEFAULT_TIMER_CONFIG,
    modeConfig: { gameMode: GameMode.SecretVillain },
  };
}

describe("presidentDrawAction", () => {
  describe("isValid", () => {
    it("valid for the president before drawing", () => {
      const game = makeGame(baseTurnState);
      expect(presidentDrawAction.isValid(game, "p1", {})).toBe(true);
    });

    it("invalid for a non-president", () => {
      const game = makeGame(baseTurnState);
      expect(presidentDrawAction.isValid(game, "p2", {})).toBe(false);
    });

    it("invalid after cards are already revealed", () => {
      const game = makeGame({
        ...baseTurnState,
        phase: {
          ...baseTurnState.phase,
          cardsRevealed: true,
        } as SecretVillainTurnState["phase"],
      });
      expect(presidentDrawAction.isValid(game, "p1", {})).toBe(false);
    });
  });

  describe("apply", () => {
    it("sets cardsRevealed to true", () => {
      const game = makeGame(baseTurnState);
      presidentDrawAction.apply(game, {}, "p1");

      const ts = (game.status as { turnState: SecretVillainTurnState })
        .turnState;
      expect(ts.phase.type).toBe(SecretVillainPhase.PolicyPresident);
      if (ts.phase.type === SecretVillainPhase.PolicyPresident) {
        expect(ts.phase.cardsRevealed).toBe(true);
      }
    });
  });
});
