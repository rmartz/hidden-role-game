import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay, Team } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "./timer-config";
import type { Game } from "@/lib/types";
import {
  SecretVillainPhase,
  PolicyCard,
  SpecialActionType,
  DECK_GOOD_CARDS,
  DECK_BAD_CARDS,
  SvBoardPreset,
} from "./types";
import { BOARD_PRESETS } from "./utils";
import type { SecretVillainTurnState } from "./types";
import { SecretVillainRole } from "./roles";
import { secretVillainServices } from "./services";

const assignments = [
  { playerId: "p1", roleDefinitionId: SecretVillainRole.Good },
  { playerId: "p2", roleDefinitionId: SecretVillainRole.Good },
  { playerId: "p3", roleDefinitionId: SecretVillainRole.Bad },
  { playerId: "p4", roleDefinitionId: SecretVillainRole.SpecialBad },
  { playerId: "p5", roleDefinitionId: SecretVillainRole.Good },
];

const playerIds = assignments.map((a) => a.playerId);

function makePlayers() {
  return playerIds.map((id) => ({
    id,
    name: `Player ${id}`,
    sessionId: `session-${id}`,
    visiblePlayers: [],
  }));
}

const baseTurnState: SecretVillainTurnState = {
  turn: 1,
  phase: {
    type: SecretVillainPhase.ElectionNomination,
    startedAt: 1000,
    presidentId: "p1",
  },
  presidentOrder: playerIds,
  currentPresidentIndex: 1,
  goodCardsPlayed: 0,
  badCardsPlayed: 0,
  deck: [],
  discardPile: [],
  eliminatedPlayerIds: [],
  failedElectionCount: 0,
  boardPreset: SvBoardPreset.Medium,
  powerTable: BOARD_PRESETS[SvBoardPreset.Medium],
};

function makeGame(turnState: SecretVillainTurnState): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.SecretVillain,
    status: { type: GameStatus.Playing, turnState },
    players: makePlayers(),
    roleAssignments: assignments,
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    modeConfig: { gameMode: GameMode.SecretVillain },
  } satisfies Game;
}

const goodRole = {
  id: SecretVillainRole.Good,
  name: "Good Role",
  team: Team.Good,
};

describe("buildInitialTurnState", () => {
  it("initializes expected defaults", () => {
    const ts = secretVillainServices.buildInitialTurnState(
      assignments,
    ) as SecretVillainTurnState;
    expect(ts.turn).toBe(1);
    expect(ts.currentPresidentIndex).toBe(1);
    expect(ts.goodCardsPlayed).toBe(0);
    expect(ts.badCardsPlayed).toBe(0);
    expect(ts.discardPile).toEqual([]);
    expect(ts.eliminatedPlayerIds).toEqual([]);
    expect(ts.failedElectionCount).toBe(0);
  });

  it("starts in ElectionNomination phase with the first president", () => {
    const ts = secretVillainServices.buildInitialTurnState(
      assignments,
    ) as SecretVillainTurnState;
    expect(ts.phase.type).toBe(SecretVillainPhase.ElectionNomination);
    expect(ts.phase.presidentId).toBe(ts.presidentOrder[0]);
  });

  it("creates a deck with 17 cards (6 Good + 11 Bad)", () => {
    const ts = secretVillainServices.buildInitialTurnState(
      assignments,
    ) as SecretVillainTurnState;
    expect(ts.deck).toHaveLength(DECK_GOOD_CARDS + DECK_BAD_CARDS);
    const goodCount = ts.deck.filter((c) => c === PolicyCard.Good).length;
    const badCount = ts.deck.filter((c) => c === PolicyCard.Bad).length;
    expect(goodCount).toBe(DECK_GOOD_CARDS);
    expect(badCount).toBe(DECK_BAD_CARDS);
  });

  it("includes all player IDs in presidentOrder", () => {
    const ts = secretVillainServices.buildInitialTurnState(
      assignments,
    ) as SecretVillainTurnState;
    expect(ts.presidentOrder).toHaveLength(playerIds.length);
    for (const id of playerIds) {
      expect(ts.presidentOrder).toContain(id);
    }
  });

  it("wires boardPreset option through to powerTable lookup", () => {
    const ts = secretVillainServices.buildInitialTurnState(assignments, {
      boardPreset: SvBoardPreset.Small,
    }) as SecretVillainTurnState;
    expect(ts.boardPreset).toBe(SvBoardPreset.Small);
    // Small preset has PolicyPeek in slot 2; Medium (the default) has InvestigateTeam there
    expect(ts.powerTable[2]).toBe(SpecialActionType.PolicyPeek);
  });

  it("resolves custom power table when preset is Custom", () => {
    const customPowerTable = [
      SpecialActionType.PolicyPeek,
      SpecialActionType.InvestigateTeam,
      undefined,
    ];
    const ts = secretVillainServices.buildInitialTurnState(assignments, {
      boardPreset: SvBoardPreset.Custom,
      customPowerTable,
    }) as SecretVillainTurnState;
    expect(ts.boardPreset).toBe(SvBoardPreset.Custom);
    expect(ts.powerTable).toEqual([
      SpecialActionType.PolicyPeek,
      SpecialActionType.InvestigateTeam,
      undefined,
      SpecialActionType.Shoot,
      SpecialActionType.Shoot,
    ]);
  });
});

describe("extractPlayerState", () => {
  it("returns empty object when game is not playing", () => {
    const game = {
      ...makeGame(baseTurnState),
      status: { type: GameStatus.Starting as const },
    } satisfies Game;
    expect(
      secretVillainServices.extractPlayerState(game, "p1", goodRole),
    ).toEqual({});
  });

  it("president sees drawn cards during PolicyPresident phase after drawing", () => {
    const ts: SecretVillainTurnState = {
      ...baseTurnState,
      phase: {
        type: SecretVillainPhase.PolicyPresident,
        startedAt: 1000,
        presidentId: "p1",
        chancellorId: "p2",
        drawnCards: [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Bad],
        cardsRevealed: true,
      },
    };
    const result = secretVillainServices.extractPlayerState(
      makeGame(ts),
      "p1",
      goodRole,
    );
    expect(result["policyCards"]).toEqual({
      drawnCards: [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Bad],
    });
  });

  it("non-president does NOT see drawn cards during PolicyPresident phase", () => {
    const ts: SecretVillainTurnState = {
      ...baseTurnState,
      phase: {
        type: SecretVillainPhase.PolicyPresident,
        startedAt: 1000,
        presidentId: "p1",
        chancellorId: "p2",
        drawnCards: [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Bad],
      },
    };
    const result = secretVillainServices.extractPlayerState(
      makeGame(ts),
      "p2",
      goodRole,
    );
    expect(result["policyCards"]).toBeUndefined();
  });

  it("chancellor sees remaining cards during PolicyChancellor phase", () => {
    const ts: SecretVillainTurnState = {
      ...baseTurnState,
      phase: {
        type: SecretVillainPhase.PolicyChancellor,
        startedAt: 1000,
        presidentId: "p1",
        chancellorId: "p2",
        remainingCards: [PolicyCard.Good, PolicyCard.Bad],
      },
    };
    const result = secretVillainServices.extractPlayerState(
      makeGame(ts),
      "p2",
      goodRole,
    );
    expect(result["policyCards"]).toEqual({
      remainingCards: [PolicyCard.Good, PolicyCard.Bad],
      vetoProposed: undefined,
      vetoResponse: undefined,
    });
  });

  it("non-chancellor does NOT see remaining cards during PolicyChancellor phase", () => {
    const ts: SecretVillainTurnState = {
      ...baseTurnState,
      phase: {
        type: SecretVillainPhase.PolicyChancellor,
        startedAt: 1000,
        presidentId: "p1",
        chancellorId: "p2",
        remainingCards: [PolicyCard.Good, PolicyCard.Bad],
      },
    };
    const result = secretVillainServices.extractPlayerState(
      makeGame(ts),
      "p3",
      goodRole,
    );
    expect(result["policyCards"]).toBeUndefined();
  });

  it("president sees veto proposal when vetoProposed is true", () => {
    const ts: SecretVillainTurnState = {
      ...baseTurnState,
      phase: {
        type: SecretVillainPhase.PolicyChancellor,
        startedAt: 1000,
        presidentId: "p1",
        chancellorId: "p2",
        remainingCards: [PolicyCard.Good, PolicyCard.Bad],
        vetoProposed: true,
      },
    };
    const result = secretVillainServices.extractPlayerState(
      makeGame(ts),
      "p1",
      goodRole,
    );
    expect(result["vetoProposal"]).toEqual({
      vetoProposed: true,
      vetoResponse: undefined,
    });
  });

  it("president sees peeked cards during PolicyPeek special action", () => {
    const ts: SecretVillainTurnState = {
      ...baseTurnState,
      phase: {
        type: SecretVillainPhase.SpecialAction,
        startedAt: 1000,
        presidentId: "p1",
        actionType: SpecialActionType.PolicyPeek,
        peekedCards: [PolicyCard.Bad, PolicyCard.Good, PolicyCard.Bad],
      },
    };
    const result = secretVillainServices.extractPlayerState(
      makeGame(ts),
      "p1",
      goodRole,
    );
    expect(result["policyCards"]).toEqual({
      peekedCards: [PolicyCard.Bad, PolicyCard.Good, PolicyCard.Bad],
    });
  });

  it("president sees investigation result when revealedTeam is set", () => {
    const ts: SecretVillainTurnState = {
      ...baseTurnState,
      phase: {
        type: SecretVillainPhase.SpecialAction,
        startedAt: 1000,
        presidentId: "p1",
        actionType: SpecialActionType.InvestigateTeam,
        targetPlayerId: "p3",
        revealedTeam: "Bad",
      },
    };
    const result = secretVillainServices.extractPlayerState(
      makeGame(ts),
      "p1",
      goodRole,
    );
    expect(result["svInvestigationResult"]).toEqual({
      targetPlayerId: "p3",
      team: "Bad",
    });
  });

  it("player sees their own election vote during ElectionVote phase", () => {
    const ts: SecretVillainTurnState = {
      ...baseTurnState,
      phase: {
        type: SecretVillainPhase.ElectionVote,
        startedAt: 1000,
        presidentId: "p1",
        chancellorNomineeId: "p2",
        votes: [{ playerId: "p3", vote: "aye" }],
      },
    };
    const result = secretVillainServices.extractPlayerState(
      makeGame(ts),
      "p3",
      goodRole,
    );
    expect(result["myElectionVote"]).toBe("aye");
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
});
