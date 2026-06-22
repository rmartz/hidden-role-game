import { describe, expect, it } from "vitest";

import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import { DEFAULT_TIMER_CONFIG, GameMode, GameStatus, Team } from "@/lib/types";

import { firebaseToPlayerState, playerStateToFirebase } from "./index";

const BASE_FIELDS = {
  lobbyId: "lobby-1",
  players: [{ id: "p1", name: "Alice", sessionId: "s1" }],
  visibleRoleAssignments: [],
  status: { type: GameStatus.Playing } as const,
};

function makeWerewolfState(
  overrides: Partial<WerewolfPlayerGameState> = {},
): WerewolfPlayerGameState {
  return {
    ...BASE_FIELDS,
    gameMode: GameMode.Werewolf,
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    nominationsEnabled: true,
    trialsPerDay: undefined,
    revealProtections: true,
    autoRevealNightOutcome: true,
    ...overrides,
  };
}

describe("Werewolf player state round-trip", () => {
  it("preserves base fields", () => {
    const state = makeWerewolfState({ myPlayerId: "p1" });
    const result = firebaseToPlayerState(playerStateToFirebase(state));
    expect(result.gameMode).toBe(GameMode.Werewolf);
    expect(result.lobbyId).toBe("lobby-1");
    expect(result.myPlayerId).toBe("p1");
  });

  it("preserves required Werewolf settings", () => {
    const state = makeWerewolfState({
      nominationsEnabled: false,
      trialsPerDay: 1,
      revealProtections: false,
      autoRevealNightOutcome: false,
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.nominationsEnabled).toBe(false);
    expect(result.trialsPerDay).toBe(1);
    expect(result.revealProtections).toBe(false);
    expect(result.autoRevealNightOutcome).toBe(false);
  });

  it("serializes myNightTarget null as myNightTargetSkipped", () => {
    const state = makeWerewolfState({ myNightTarget: null });
    const firebase = playerStateToFirebase(state);
    expect("myNightTargetSkipped" in firebase).toBe(true);
    expect("myNightTarget" in firebase).toBe(false);
    const result = firebaseToPlayerState(firebase) as WerewolfPlayerGameState;
    expect(result.myNightTarget).toBeNull();
  });

  it("preserves optional fields when present", () => {
    const state = makeWerewolfState({
      myNightTarget: "p2",
      myNightTargetConfirmed: true,
      nightStatus: [{ targetPlayerId: "p2", effect: "killed" }],
      isSilenced: true,
      mirrorcasterCharged: true,
      mercenaryCharged: true,
      mercenaryBribedPlayerIds: ["p3", "p4"],
      mercenaryAlsoWins: true,
      monarchKnightedPlayerIds: ["p2", "p3"],
      monarchKnightingsUsed: 2,
      hunterRevengePlayerId: "p1",
      pendingGuiltId: "p3",
      martyrUsed: true,
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.myNightTarget).toBe("p2");
    expect(result.myNightTargetConfirmed).toBe(true);
    expect(result.nightStatus).toEqual([
      { targetPlayerId: "p2", effect: "killed" },
    ]);
    expect(result.isSilenced).toBe(true);
    expect(result.mirrorcasterCharged).toBe(true);
    expect(result.mercenaryCharged).toBe(true);
    expect(result.mercenaryBribedPlayerIds).toEqual(["p3", "p4"]);
    expect(result.mercenaryAlsoWins).toBe(true);
    expect(result.monarchKnightedPlayerIds).toEqual(["p2", "p3"]);
    expect(result.monarchKnightingsUsed).toBe(2);
    expect(result.hunterRevengePlayerId).toBe("p1");
    expect(result.pendingGuiltId).toBe("p3");
    expect(result.martyrUsed).toBe(true);
  });

  it("preserves Veteran alert fields when present", () => {
    const state = makeWerewolfState({
      veteranAlertsUsed: 2,
      myNightAlerted: true,
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.veteranAlertsUsed).toBe(2);
    expect(result.myNightAlerted).toBe(true);
  });

  it("omits Veteran alert fields when absent", () => {
    const state = makeWerewolfState();
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.veteranAlertsUsed).toBeUndefined();
    expect(result.myNightAlerted).toBeUndefined();
  });

  it("round-trips alphaWolfBiteUsed", () => {
    const state = makeWerewolfState({ alphaWolfBiteUsed: true });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.alphaWolfBiteUsed).toBe(true);
  });

  it("round-trips roleConversions", () => {
    const conversions = [
      { playerId: "p3", newRoleDefinitionId: WerewolfRole.Werewolf },
    ];
    const state = makeWerewolfState({ roleConversions: conversions });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.roleConversions).toEqual(conversions);
  });

  it("omits alphaWolfBiteUsed and roleConversions when absent", () => {
    const state = makeWerewolfState();
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.alphaWolfBiteUsed).toBeUndefined();
    expect(result.roleConversions).toBeUndefined();
  });

  it("omits optional fields when absent", () => {
    const state = makeWerewolfState();
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.myNightTarget).toBeUndefined();
    expect(result.isSilenced).toBeUndefined();
    expect(result.nightStatus).toBeUndefined();
  });

  it("preserves Werewolf-specific timer fields", () => {
    const state = makeWerewolfState({
      timerConfig: {
        autoAdvance: true,
        startCountdownSeconds: 5,
        nightPhaseSeconds: 45,
        dayPhaseSeconds: 180,
        votePhaseSeconds: 30,
        defensePhaseSeconds: 15,
      },
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.timerConfig.autoAdvance).toBe(true);
    expect(result.timerConfig.nightPhaseSeconds).toBe(45);
    expect(result.timerConfig.dayPhaseSeconds).toBe(180);
    expect(result.timerConfig.votePhaseSeconds).toBe(30);
    expect(result.timerConfig.defensePhaseSeconds).toBe(15);
  });

  it("preserves visibleRoleAssignments including role", () => {
    const state = makeWerewolfState({
      visibleRoleAssignments: [
        {
          player: { id: "p2", name: "Bob" },
          reason: "aware-of",
          role: { id: "werewolf-seer", name: "Seer", team: Team.Good },
        },
      ],
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as WerewolfPlayerGameState;
    expect(result.visibleRoleAssignments).toHaveLength(1);
    const assignment = result.visibleRoleAssignments[0];
    expect(assignment?.reason).toBe("aware-of");
    expect(assignment?.role?.id).toBe("werewolf-seer");
    expect(assignment?.role?.team).toBe(Team.Good);
  });

  it("preserves amDead and deadPlayerIds", () => {
    const state = makeWerewolfState({
      amDead: true,
      deadPlayerIds: ["p2", "p3"],
    });
    const result = firebaseToPlayerState(playerStateToFirebase(state));
    expect(result.amDead).toBe(true);
    expect(result.deadPlayerIds).toEqual(["p2", "p3"]);
  });

  it("round-trips victoryCondition when present", () => {
    const state = makeWerewolfState({
      victoryCondition: {
        label: "All werewolves eliminated",
        winner: Team.Good,
      },
    });
    const result = firebaseToPlayerState(playerStateToFirebase(state));
    expect(result.victoryCondition).toEqual({
      label: "All werewolves eliminated",
      winner: Team.Good,
    });
  });

  it("omits victoryCondition when absent", () => {
    const state = makeWerewolfState();
    const result = firebaseToPlayerState(playerStateToFirebase(state));
    expect(result.victoryCondition).toBeUndefined();
  });

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

describe("firebaseToPlayerState", () => {
  it("throws for unknown game mode", () => {
    const raw = {
      gameMode: "unknown-mode",
      statusJson: JSON.stringify({ type: GameStatus.Playing }),
      lobbyId: "lobby-1",
      gameOwner: null,
      myPlayerId: null,
      myRole: null,
      timerConfig: DEFAULT_TIMER_CONFIG,
    };
    expect(() =>
      firebaseToPlayerState(raw as Parameters<typeof firebaseToPlayerState>[0]),
    ).toThrow("Unknown game mode");
  });
});
