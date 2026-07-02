import { describe, expect, it } from "vitest";

import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { Team } from "@/lib/types";

import { firebaseToPlayerState, playerStateToFirebase } from "../index";
import { makeWerewolfState } from "./werewolf-fixtures";

describe("Werewolf player state round-trip (role-specific fields)", () => {
  it("round-trips evilEmpathRevealedResult when set to true", () => {
    const state = makeWerewolfState({ evilEmpathRevealedResult: true });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.evilEmpathRevealedResult).toBe(true);
  });

  it("round-trips evilEmpathRevealedResult when set to false", () => {
    const state = makeWerewolfState({ evilEmpathRevealedResult: false });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.evilEmpathRevealedResult).toBe(false);
  });

  it("omits evilEmpathRevealedResult when absent", () => {
    const state = makeWerewolfState();
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.evilEmpathRevealedResult).toBeUndefined();
  });

  it("round-trips thingTappedMe", () => {
    const state = makeWerewolfState({ thingTappedMe: true });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.thingTappedMe).toBe(true);
  });

  it("round-trips thingTappedPlayerId", () => {
    const state = makeWerewolfState({ thingTappedPlayerId: "p2" });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.thingTappedPlayerId).toBe("p2");
  });

  it("round-trips insomniacResult", () => {
    const state = makeWerewolfState({
      insomniacResult: { leftActed: true, rightActed: false },
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.insomniacResult).toEqual({
      leftActed: true,
      rightActed: false,
    });
  });

  it("round-trips countResult", () => {
    const state = makeWerewolfState({
      countResult: { leftCount: 2, rightCount: 1 },
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.countResult).toEqual({ leftCount: 2, rightCount: 1 });
  });

  it("round-trips adjacentPlayerIds", () => {
    const state = makeWerewolfState({ adjacentPlayerIds: ["p1", "p3"] });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.adjacentPlayerIds).toEqual(["p1", "p3"]);
  });

  it("round-trips illuminatiRoleAssignments including team cast", () => {
    const state = makeWerewolfState({
      illuminatiRoleAssignments: [
        { playerId: "p2", roleName: "Seer", team: Team.Good },
        { playerId: "p3", roleName: "Werewolf", team: Team.Bad },
      ],
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.illuminatiRoleAssignments).toHaveLength(2);
    expect(result.illuminatiRoleAssignments?.[0]).toEqual({
      playerId: "p2",
      roleName: "Seer",
      team: Team.Good,
    });
    expect(result.illuminatiRoleAssignments?.[1]).toEqual({
      playerId: "p3",
      roleName: "Werewolf",
      team: Team.Bad,
    });
  });

  it("round-trips evilEmpathNightResult when set to true", () => {
    const state = makeWerewolfState({ evilEmpathNightResult: true });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.evilEmpathNightResult).toBe(true);
  });

  it("round-trips evilEmpathNightResult when set to false", () => {
    const state = makeWerewolfState({ evilEmpathNightResult: false });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.evilEmpathNightResult).toBe(false);
  });

  it("omits evilEmpathNightResult when absent", () => {
    const state = makeWerewolfState();
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.evilEmpathNightResult).toBeUndefined();
  });

  it("omits positional, evil empath, and illuminati fields when absent", () => {
    const state = makeWerewolfState();
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.thingTappedMe).toBeUndefined();
    expect(result.thingTappedPlayerId).toBeUndefined();
    expect(result.insomniacResult).toBeUndefined();
    expect(result.countResult).toBeUndefined();
    expect(result.adjacentPlayerIds).toBeUndefined();
    expect(result.evilEmpathRevealedResult).toBeUndefined();
    expect(result.evilEmpathNightResult).toBeUndefined();
    expect(result.illuminatiRoleAssignments).toBeUndefined();
  });

  it("round-trips arsonistDousedPlayerIds when present", () => {
    const state = makeWerewolfState({
      arsonistDousedPlayerIds: ["p2", "p3"],
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.arsonistDousedPlayerIds).toEqual(["p2", "p3"]);
  });

  it("omits arsonistDousedPlayerIds when absent", () => {
    const state = makeWerewolfState();
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.arsonistDousedPlayerIds).toBeUndefined();
  });

  it("round-trips ghostClues when present", () => {
    const state = makeWerewolfState({
      ghostClues: [
        { turn: 1, clue: "abc" },
        { turn: 2, clue: "xyz" },
      ],
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.ghostClues).toEqual([
      { turn: 1, clue: "abc" },
      { turn: 2, clue: "xyz" },
    ]);
  });

  it("omits ghostClues when absent", () => {
    const state = makeWerewolfState();
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.ghostClues).toBeUndefined();
  });

  it("round-trips ghostClueSubmittedThisTurn when true", () => {
    const state = makeWerewolfState({ ghostClueSubmittedThisTurn: true });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.ghostClueSubmittedThisTurn).toBe(true);
  });

  it("omits ghostClueSubmittedThisTurn when absent", () => {
    const state = makeWerewolfState();
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.ghostClueSubmittedThisTurn).toBeUndefined();
  });

  it("round-trips ghostVisible when true", () => {
    const state = makeWerewolfState({ ghostVisible: true });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.ghostVisible).toBe(true);
  });

  it("omits ghostVisible when absent", () => {
    const state = makeWerewolfState();
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.ghostVisible).toBeUndefined();
  });
});
