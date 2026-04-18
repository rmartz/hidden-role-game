import { describe, it, expect } from "vitest";
import { playerStateToFirebase, firebaseToPlayerState } from "./index";
import { GameMode, GameStatus, Team } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import { DEFAULT_TIMER_CONFIG } from "@/lib/types";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";
import type { AvalonPlayerGameState } from "@/lib/game/modes/avalon/player-state";
import { SecretVillainPhase } from "@/lib/game/modes/secret-villain/types";
import { SvTheme } from "@/lib/game/modes/secret-villain/themes";

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
    trialsPerDay: 0,
    revealProtections: true,
    autoRevealNightOutcome: true,
    ...overrides,
  };
}

function makeSecretVillainState(
  overrides: Partial<SecretVillainPlayerGameState> = {},
): SecretVillainPlayerGameState {
  return {
    ...BASE_FIELDS,
    gameMode: GameMode.SecretVillain,
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    ...overrides,
  };
}

function makeAvalonState(
  overrides: Partial<AvalonPlayerGameState> = {},
): AvalonPlayerGameState {
  return {
    ...BASE_FIELDS,
    gameMode: GameMode.Avalon,
    timerConfig: DEFAULT_TIMER_CONFIG,
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
      hunterRevengePlayerId: "p1",
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
    expect(result.hunterRevengePlayerId).toBe("p1");
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
});

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
});

describe("Avalon player state round-trip", () => {
  it("preserves base fields", () => {
    const state = makeAvalonState({ myPlayerId: "p1" });
    const result = firebaseToPlayerState(playerStateToFirebase(state));
    expect(result.gameMode).toBe(GameMode.Avalon);
    expect(result.lobbyId).toBe("lobby-1");
    expect(result.myPlayerId).toBe("p1");
  });

  it("preserves custom timerConfig values", () => {
    const state = makeAvalonState({
      timerConfig: { autoAdvance: true, startCountdownSeconds: 99 },
    });
    const result = firebaseToPlayerState(playerStateToFirebase(state));
    expect(result.timerConfig.autoAdvance).toBe(true);
    expect(result.timerConfig.startCountdownSeconds).toBe(99);
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
