import { describe, expect, it } from "vitest";

import { secretVillainServices } from "../services";
import type { SecretVillainTurnState } from "../types";
import { PolicyCard, SecretVillainPhase, SpecialActionType } from "../types";
import { baseTurnState, goodRole, makeGame } from "./helpers";

describe("extractPlayerState — policy and special actions", () => {
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
});
