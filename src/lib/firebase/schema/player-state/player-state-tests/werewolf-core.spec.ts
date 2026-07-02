import { describe, expect, it } from "vitest";

import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";
import { GameMode, Team } from "@/lib/types";

import { firebaseToPlayerState, playerStateToFirebase } from "../index";
import { makeWerewolfState } from "./werewolf-fixtures";

describe("Werewolf player state round-trip (core)", () => {
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
});
