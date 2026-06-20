import { describe, expect, it } from "vitest";

import type { Game } from "@/lib/types";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";

import { SecretVillainRole } from "../roles";
import { secretVillainServices } from "../services";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "../timer-config";
import type { SecretVillainTurnState } from "../types";
import { SecretVillainPhase } from "../types";
import { baseTurnState, goodRole, makeGame } from "./helpers";

describe("extractPlayerState — election, death, and visibility", () => {
  it("returns empty object when game is not playing", () => {
    const game = {
      ...makeGame(baseTurnState),
      status: { type: GameStatus.Starting as const },
    } satisfies Game;
    expect(
      secretVillainServices.extractPlayerState(game, "p1", goodRole),
    ).toEqual({});
  });

  it("player sees their own election vote during ElectionVote phase", () => {
    const ts: SecretVillainTurnState = {
      ...baseTurnState,
      phase: {
        type: SecretVillainPhase.ElectionVote,
        startedAt: 1000,
        presidentId: "p1",
        chancellorNomineeId: "p2",
        votes: [{ playerId: "p3", vote: "yes" }],
      },
    };
    const result = secretVillainServices.extractPlayerState(
      makeGame(ts),
      "p3",
      goodRole,
    );
    expect(result["myElectionVote"]).toBe("yes");
  });

  it("president sees eligible chancellor IDs during ElectionNomination phase", () => {
    const result = secretVillainServices.extractPlayerState(
      makeGame(baseTurnState),
      "p1",
      goodRole,
    );
    expect(result["eligibleChancellorIds"]).toBeDefined();
    expect(Array.isArray(result["eligibleChancellorIds"])).toBe(true);
    expect(result["eligibleChancellorIds"]).not.toContain("p1");
  });

  it("eliminated player has amDead set to true", () => {
    const ts: SecretVillainTurnState = {
      ...baseTurnState,
      eliminatedPlayerIds: ["p3"],
    };
    const result = secretVillainServices.extractPlayerState(
      makeGame(ts),
      "p3",
      goodRole,
    );
    expect(result["amDead"]).toBe(true);
  });

  it("deadPlayerIds is set when any players are eliminated", () => {
    const ts: SecretVillainTurnState = {
      ...baseTurnState,
      eliminatedPlayerIds: ["p3", "p5"],
    };
    const result = secretVillainServices.extractPlayerState(
      makeGame(ts),
      "p1",
      goodRole,
    );
    expect(result["deadPlayerIds"]).toEqual(["p3", "p5"]);
  });

  it("Special Bad does not see Bad teammate in a multi-fascist game (3+ Bad team members)", () => {
    // 7-player game with 3 Bad-team members total: 2 Bad + 1 SpecialBad.
    // In this larger setup, the SpecialBad should NOT see the Bad players.
    const largeAssignments = [
      { playerId: "p1", roleDefinitionId: SecretVillainRole.Good },
      { playerId: "p2", roleDefinitionId: SecretVillainRole.Good },
      { playerId: "p3", roleDefinitionId: SecretVillainRole.Bad },
      { playerId: "p4", roleDefinitionId: SecretVillainRole.Bad },
      { playerId: "p5", roleDefinitionId: SecretVillainRole.SpecialBad },
      { playerId: "p6", roleDefinitionId: SecretVillainRole.Good },
      { playerId: "p7", roleDefinitionId: SecretVillainRole.Good },
    ];
    const largePlayers = largeAssignments.map((a) => ({
      id: a.playerId,
      name: `Player ${a.playerId}`,
      sessionId: `session-${a.playerId}`,
      visiblePlayers: [],
    }));
    const largeTurnState: SecretVillainTurnState = {
      ...baseTurnState,
      presidentOrder: largeAssignments.map((a) => a.playerId),
    };
    const largeGame: Game = {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.SecretVillain,
      status: { type: GameStatus.Playing, turnState: largeTurnState },
      players: largePlayers,
      roleAssignments: largeAssignments,
      configuredRoleBuckets: [],
      showRolesInPlay: ShowRolesInPlay.None,
      timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
      modeConfig: { gameMode: GameMode.SecretVillain },
    } satisfies Game;
    const result = secretVillainServices.extractPlayerState(
      largeGame,
      "p5",
      goodRole,
    );
    expect(result["modeVisiblePlayerIds"]).toBeUndefined();
  });

  it("Special Bad sees the Bad teammate in a 2-fascist game (1 Bad + 1 SpecialBad)", () => {
    // 5-player game: the default — exactly 1 Bad + 1 SpecialBad
    const result = secretVillainServices.extractPlayerState(
      makeGame(baseTurnState),
      "p4", // p4 is SpecialBad; p3 is Bad
      goodRole,
    );
    expect(result["modeVisiblePlayerIds"]).toEqual(["p3"]);
  });

  it("Good player does not receive modeVisiblePlayerIds", () => {
    const result = secretVillainServices.extractPlayerState(
      makeGame(baseTurnState),
      "p1",
      goodRole,
    );
    expect(result["modeVisiblePlayerIds"]).toBeUndefined();
  });
});
