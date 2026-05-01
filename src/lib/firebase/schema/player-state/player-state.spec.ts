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
import {
  AvalonPhase,
  QuestCard,
  TeamVote,
} from "@/lib/game/modes/avalon/types";

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

  it("round-trips questResults as JSON", () => {
    const questResults = [
      { questNumber: 1, teamSize: 2, failCount: 0, succeeded: true },
      { questNumber: 2, teamSize: 3, failCount: 1, succeeded: false },
    ];
    const state = makeAvalonState({ questResults });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.questResults).toEqual(questResults);
  });

  it("round-trips currentQuest as JSON", () => {
    const currentQuest = {
      questNumber: 3,
      teamSize: 4,
      requiresTwoFails: true,
    };
    const state = makeAvalonState({ currentQuest });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.currentQuest).toEqual(currentQuest);
  });

  it("round-trips avalonPhase as JSON", () => {
    const avalonPhase = {
      type: AvalonPhase.TeamProposal,
      leaderId: "p1",
      teamSize: 2,
    };
    const state = makeAvalonState({ avalonPhase });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.avalonPhase).toEqual(avalonPhase);
  });

  it("round-trips proposedTeam", () => {
    const state = makeAvalonState({ proposedTeam: ["p1", "p2"] });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.proposedTeam).toEqual(["p1", "p2"]);
  });

  it("round-trips myTeamVote", () => {
    const state = makeAvalonState({ myTeamVote: TeamVote.Approve });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.myTeamVote).toBe(TeamVote.Approve);
  });

  it("round-trips teamVotes as JSON", () => {
    const teamVotes = [
      { playerId: "p1", vote: TeamVote.Approve },
      { playerId: "p2", vote: TeamVote.Reject },
    ];
    const state = makeAvalonState({ teamVotes });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.teamVotes).toEqual(teamVotes);
  });

  it("round-trips teamVotePassed", () => {
    const state = makeAvalonState({ teamVotePassed: false });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.teamVotePassed).toBe(false);
  });

  it("round-trips consecutiveRejections", () => {
    const state = makeAvalonState({ consecutiveRejections: 3 });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.consecutiveRejections).toBe(3);
  });

  it("round-trips myQuestCard", () => {
    const state = makeAvalonState({ myQuestCard: QuestCard.Fail });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.myQuestCard).toBe(QuestCard.Fail);
  });

  it("round-trips questFailCount", () => {
    const state = makeAvalonState({ questFailCount: 2 });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.questFailCount).toBe(2);
  });

  it("round-trips assassinationTarget", () => {
    const state = makeAvalonState({ assassinationTarget: "p3" });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.assassinationTarget).toBe("p3");
  });

  it("round-trips eligibleTeamMemberIds", () => {
    const state = makeAvalonState({
      eligibleTeamMemberIds: ["p1", "p2", "p3"],
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.eligibleTeamMemberIds).toEqual(["p1", "p2", "p3"]);
  });

  it("round-trips assassinationTargetIds", () => {
    const state = makeAvalonState({
      assassinationTargetIds: ["p1", "p2", "p4"],
    });
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.assassinationTargetIds).toEqual(["p1", "p2", "p4"]);
  });

  it("omits optional Avalon fields when absent", () => {
    const state = makeAvalonState();
    const result = firebaseToPlayerState(
      playerStateToFirebase(state),
    ) as AvalonPlayerGameState;
    expect(result.questResults).toBeUndefined();
    expect(result.currentQuest).toBeUndefined();
    expect(result.avalonPhase).toBeUndefined();
    expect(result.proposedTeam).toBeUndefined();
    expect(result.myTeamVote).toBeUndefined();
    expect(result.teamVotes).toBeUndefined();
    expect(result.teamVotePassed).toBeUndefined();
    expect(result.consecutiveRejections).toBeUndefined();
    expect(result.myQuestCard).toBeUndefined();
    expect(result.questFailCount).toBeUndefined();
    expect(result.assassinationTarget).toBeUndefined();
    expect(result.eligibleTeamMemberIds).toBeUndefined();
    expect(result.assassinationTargetIds).toBeUndefined();
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
