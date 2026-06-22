import { describe, expect, it } from "vitest";

import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";
import { SvTheme } from "@/lib/game/modes/secret-villain/themes";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import { SecretVillainPhase } from "@/lib/game/modes/secret-villain/types";
import { GameMode, GameStatus } from "@/lib/types";

import { firebaseToPlayerState, playerStateToFirebase } from "../index";

function makeSecretVillainState(
  overrides: Partial<SecretVillainPlayerGameState> = {},
): SecretVillainPlayerGameState {
  return {
    lobbyId: "lobby-1",
    players: [{ id: "p1", name: "Alice", sessionId: "s1" }],
    visibleRoleAssignments: [],
    status: { type: GameStatus.Playing } as const,
    gameMode: GameMode.SecretVillain,
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    ...overrides,
  };
}

describe("Secret Villain player state round-trip", () => {
  it("preserves base fields", () => {
    const state = makeSecretVillainState({ myPlayerId: "p1" });
    const result = firebaseToPlayerState(playerStateToFirebase(state));
    expect(result.gameMode).toBe(GameMode.SecretVillain);
    expect(result.myPlayerId).toBe("p1");
  });

  it("round-trips svBoard and svPhase as JSON", () => {
    const state = makeSecretVillainState({
      svBoard: {
        goodCardsPlayed: 2,
        badCardsPlayed: 1,
        failedElectionCount: 0,
      },
      svPhase: {
        type: SecretVillainPhase.ElectionNomination,
        presidentId: "p1",
      },
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as SecretVillainPlayerGameState;
    expect(result.svBoard).toEqual({
      goodCardsPlayed: 2,
      badCardsPlayed: 1,
      failedElectionCount: 0,
    });
    expect(result.svPhase?.type).toBe(SecretVillainPhase.ElectionNomination);
    expect(result.svPhase?.presidentId).toBe("p1");
  });

  it("preserves svTheme", () => {
    const state = makeSecretVillainState({ svTheme: SvTheme.Default });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as SecretVillainPlayerGameState;
    expect(result.svTheme).toBe(SvTheme.Default);
  });

  it("omits optional SV fields when absent", () => {
    const state = makeSecretVillainState();
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as SecretVillainPlayerGameState;
    expect(result.svBoard).toBeUndefined();
    expect(result.svPhase).toBeUndefined();
    expect(result.electionVotes).toBeUndefined();
  });

  it("round-trips election votes", () => {
    const votes = [
      { playerId: "p1", vote: "yes" as const },
      { playerId: "p2", vote: "no" as const },
    ];
    const state = makeSecretVillainState({ electionVotes: votes });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as SecretVillainPlayerGameState;
    expect(result.electionVotes).toHaveLength(2);
    expect(result.electionVotes?.at(0)?.playerId).toBe("p1");
    expect(result.electionVotes?.at(0)?.vote).toBe("yes");
  });

  it("round-trips svSpecialBadReveal with revealed = true", () => {
    const state = makeSecretVillainState({
      svSpecialBadReveal: { chancellorId: "p2", revealed: true },
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as SecretVillainPlayerGameState;
    expect(result.svSpecialBadReveal?.chancellorId).toBe("p2");
    expect(result.svSpecialBadReveal?.revealed).toBe(true);
  });

  it("round-trips svSpecialBadReveal with revealed = false", () => {
    const state = makeSecretVillainState({
      svSpecialBadReveal: { chancellorId: "p3", revealed: false },
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as SecretVillainPlayerGameState;
    expect(result.svSpecialBadReveal?.chancellorId).toBe("p3");
    expect(result.svSpecialBadReveal?.revealed).toBe(false);
  });

  it("omits svSpecialBadReveal when absent", () => {
    const state = makeSecretVillainState();
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as SecretVillainPlayerGameState;
    expect(result.svSpecialBadReveal).toBeUndefined();
  });
});
