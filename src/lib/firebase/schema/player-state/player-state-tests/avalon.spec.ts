import { describe, expect, it } from "vitest";

import type { AvalonPlayerGameState } from "@/lib/game/modes/avalon/player-state";
import {
  AvalonPhase,
  QuestCard,
  TeamVote,
} from "@/lib/game/modes/avalon/types";
import { GameMode } from "@/lib/types";
import { DEFAULT_TIMER_CONFIG } from "@/lib/types";

import { firebaseToPlayerState, playerStateToFirebase } from "../index";

function makeAvalonState(
  overrides: Partial<AvalonPlayerGameState> = {},
): AvalonPlayerGameState {
  return {
    lobbyId: "lobby-1",
    players: [{ id: "p1", name: "Alice", sessionId: "s1" }],
    visibleRoleAssignments: [],
    status: { type: "Playing" } as const,
    gameMode: GameMode.Avalon,
    timerConfig: DEFAULT_TIMER_CONFIG,
    ...overrides,
  };
}

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
      {
        questNumber: 1,
        teamSize: 2,
        teamPlayerIds: ["p1", "p2"],
        failCount: 0,
        succeeded: true,
      },
      {
        questNumber: 2,
        teamSize: 3,
        teamPlayerIds: ["p1", "p2", "p3"],
        failCount: 1,
        succeeded: false,
      },
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
