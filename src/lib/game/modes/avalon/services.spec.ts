import { describe, it, expect } from "vitest";
import {
  GameMode,
  GameStatus,
  ShowRolesInPlay,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import type { Game } from "@/lib/types";
import { AvalonPhase, TeamVote, QuestCard } from "./types";
import type { AvalonTurnState } from "./types";
import { AvalonRole } from "./roles";
import { avalonServices } from "./services";

const assignments = [
  { playerId: "p1", roleDefinitionId: AvalonRole.Merlin },
  { playerId: "p2", roleDefinitionId: AvalonRole.LoyalServant },
  { playerId: "p3", roleDefinitionId: AvalonRole.LoyalServant },
  { playerId: "p4", roleDefinitionId: AvalonRole.MinionOfMordred },
  { playerId: "p5", roleDefinitionId: AvalonRole.Assassin },
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

const baseTurnState: AvalonTurnState = {
  questNumber: 1,
  phase: {
    type: AvalonPhase.TeamProposal,
    leaderId: "p1",
    teamSize: 2,
  },
  leaderOrder: playerIds,
  currentLeaderIndex: 0,
  questResults: [],
  consecutiveRejections: 0,
  questTeamSizes: [2, 3, 2, 3, 3],
  requiresTwoFails: [],
};

function makeGame(turnState: AvalonTurnState): Game {
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Avalon,
    status: { type: GameStatus.Playing, turnState },
    players: makePlayers(),
    roleAssignments: assignments,
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    timerConfig: DEFAULT_TIMER_CONFIG,
    modeConfig: { gameMode: GameMode.Avalon },
  } satisfies Game;
}

const merlinRole = { id: AvalonRole.Merlin, name: "Merlin", team: "Good" };
const assassinRole = { id: AvalonRole.Assassin, name: "Assassin", team: "Bad" };

describe("buildInitialTurnState", () => {
  it("starts at quest 1 with TeamProposal phase", () => {
    const ts = avalonServices.buildInitialTurnState(
      assignments,
    ) as AvalonTurnState;
    expect(ts.questNumber).toBe(1);
    expect(ts.phase.type).toBe(AvalonPhase.TeamProposal);
  });

  it("sets correct team sizes for 5 players", () => {
    const ts = avalonServices.buildInitialTurnState(
      assignments,
    ) as AvalonTurnState;
    expect(ts.questTeamSizes).toEqual([2, 3, 2, 3, 3]);
  });

  it("sets correct team sizes for 7 players", () => {
    const sevenAssignments = [
      { playerId: "p1", roleDefinitionId: AvalonRole.Merlin },
      { playerId: "p2", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p3", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p4", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p5", roleDefinitionId: AvalonRole.MinionOfMordred },
      { playerId: "p6", roleDefinitionId: AvalonRole.MinionOfMordred },
      { playerId: "p7", roleDefinitionId: AvalonRole.Assassin },
    ];
    const ts = avalonServices.buildInitialTurnState(
      sevenAssignments,
    ) as AvalonTurnState;
    expect(ts.questTeamSizes).toEqual([2, 3, 3, 4, 4]);
  });

  it("does not require two fails for 5 players", () => {
    const ts = avalonServices.buildInitialTurnState(
      assignments,
    ) as AvalonTurnState;
    expect(ts.requiresTwoFails).toEqual([]);
  });

  it("requires two fails on quest 4 for 7+ players", () => {
    const sevenAssignments = [
      { playerId: "p1", roleDefinitionId: AvalonRole.Merlin },
      { playerId: "p2", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p3", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p4", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p5", roleDefinitionId: AvalonRole.MinionOfMordred },
      { playerId: "p6", roleDefinitionId: AvalonRole.MinionOfMordred },
      { playerId: "p7", roleDefinitionId: AvalonRole.Assassin },
    ];
    const ts = avalonServices.buildInitialTurnState(
      sevenAssignments,
    ) as AvalonTurnState;
    expect(ts.requiresTwoFails).toEqual([4]);
  });

  it("preserves playerOrder as leader rotation when provided", () => {
    const specifiedOrder = ["p5", "p3", "p1", "p4", "p2"];
    const ts = avalonServices.buildInitialTurnState(assignments, {
      playerOrder: specifiedOrder,
    }) as AvalonTurnState;
    expect(ts.leaderOrder).toEqual(specifiedOrder);
  });

  it("first leader matches first player in leaderOrder", () => {
    const specifiedOrder = ["p3", "p1", "p2", "p5", "p4"];
    const ts = avalonServices.buildInitialTurnState(assignments, {
      playerOrder: specifiedOrder,
    }) as AvalonTurnState;
    expect(ts.phase.type).toBe(AvalonPhase.TeamProposal);
    if (ts.phase.type === AvalonPhase.TeamProposal) {
      expect(ts.phase.leaderId).toBe("p3");
    }
  });

  it("shuffles players when no playerOrder is provided", () => {
    const results = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const ts = avalonServices.buildInitialTurnState(
        assignments,
      ) as AvalonTurnState;
      results.add(ts.leaderOrder.join(","));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("throws for unsupported player count", () => {
    const fourAssignments = [
      { playerId: "p1", roleDefinitionId: AvalonRole.Merlin },
      { playerId: "p2", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p3", roleDefinitionId: AvalonRole.MinionOfMordred },
      { playerId: "p4", roleDefinitionId: AvalonRole.Assassin },
    ];
    expect(() => avalonServices.buildInitialTurnState(fourAssignments)).toThrow(
      "No quest configuration for 4 players",
    );
  });

  it("initializes consecutiveRejections and questResults to 0 and empty", () => {
    const ts = avalonServices.buildInitialTurnState(
      assignments,
    ) as AvalonTurnState;
    expect(ts.consecutiveRejections).toBe(0);
    expect(ts.questResults).toEqual([]);
  });
});

describe("extractPlayerState", () => {
  it("returns empty object when game is not playing", () => {
    const game = {
      ...makeGame(baseTurnState),
      status: { type: GameStatus.Starting as const },
    } satisfies Game;
    expect(avalonServices.extractPlayerState(game, "p1", merlinRole)).toEqual(
      {},
    );
  });

  it("all players see questResults, consecutiveRejections, and currentQuest", () => {
    const result = avalonServices.extractPlayerState(
      makeGame(baseTurnState),
      "p2",
      merlinRole,
    );
    expect(result["questResults"]).toEqual([]);
    expect(result["consecutiveRejections"]).toBe(0);
    expect(result["currentQuest"]).toEqual({
      questNumber: 1,
      teamSize: 2,
      requiresTwoFails: false,
    });
  });

  it("all players see avalonPhase with type and leaderId during TeamProposal", () => {
    const result = avalonServices.extractPlayerState(
      makeGame(baseTurnState),
      "p2",
      merlinRole,
    );
    expect(result["avalonPhase"]).toMatchObject({
      type: AvalonPhase.TeamProposal,
      leaderId: "p1",
      teamSize: 2,
    });
  });

  it("Quest Leader sees eligibleTeamMemberIds during TeamProposal", () => {
    const result = avalonServices.extractPlayerState(
      makeGame(baseTurnState),
      "p1",
      merlinRole,
    );
    expect(result["eligibleTeamMemberIds"]).toEqual(playerIds);
  });

  it("non-leader does not see eligibleTeamMemberIds during TeamProposal", () => {
    const result = avalonServices.extractPlayerState(
      makeGame(baseTurnState),
      "p2",
      merlinRole,
    );
    expect(result["eligibleTeamMemberIds"]).toBeUndefined();
  });

  it("proposed team visible during TeamProposal when set", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.TeamProposal,
        leaderId: "p1",
        teamSize: 2,
        proposedTeam: ["p1", "p3"],
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p2",
      merlinRole,
    );
    expect(result["proposedTeam"]).toEqual(["p1", "p3"]);
  });

  it("proposed team visible to all during TeamVote", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.TeamVote,
        leaderId: "p1",
        proposedTeam: ["p1", "p3"],
        votes: [],
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p2",
      merlinRole,
    );
    expect(result["proposedTeam"]).toEqual(["p1", "p3"]);
  });

  it("player sees their own vote during TeamVote", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.TeamVote,
        leaderId: "p1",
        proposedTeam: ["p1", "p3"],
        votes: [{ playerId: "p2", vote: TeamVote.Approve }],
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p2",
      merlinRole,
    );
    expect(result["myTeamVote"]).toBe(TeamVote.Approve);
  });

  it("all votes visible after TeamVote resolves", () => {
    const votes = [
      { playerId: "p1", vote: TeamVote.Approve },
      { playerId: "p2", vote: TeamVote.Reject },
    ];
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.TeamVote,
        leaderId: "p1",
        proposedTeam: ["p1", "p3"],
        votes,
        passed: true,
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p3",
      merlinRole,
    );
    expect(result["teamVotes"]).toEqual(votes);
    expect(result["teamVotePassed"]).toBe(true);
  });

  it("votes not visible before TeamVote resolves", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.TeamVote,
        leaderId: "p1",
        proposedTeam: ["p1", "p3"],
        votes: [{ playerId: "p1", vote: TeamVote.Approve }],
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p3",
      merlinRole,
    );
    expect(result["teamVotes"]).toBeUndefined();
    expect(result["teamVotePassed"]).toBeUndefined();
  });

  it("avalonPhase includes teamPlayerIds during Quest phase", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.Quest,
        leaderId: "p1",
        teamPlayerIds: ["p1", "p3"],
        cards: [],
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p2",
      merlinRole,
    );
    expect(result["avalonPhase"]).toMatchObject({
      type: AvalonPhase.Quest,
      leaderId: "p1",
      teamPlayerIds: ["p1", "p3"],
    });
  });

  it("team member sees their own quest card after playing", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.Quest,
        leaderId: "p1",
        teamPlayerIds: ["p1", "p3"],
        cards: [{ playerId: "p1", card: QuestCard.Success }],
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p1",
      merlinRole,
    );
    expect(result["myQuestCard"]).toBe(QuestCard.Success);
  });

  it("fail count not visible before quest resolves", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.Quest,
        leaderId: "p1",
        teamPlayerIds: ["p1", "p3"],
        cards: [{ playerId: "p1", card: QuestCard.Success }],
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p2",
      merlinRole,
    );
    expect(result["questFailCount"]).toBeUndefined();
  });

  it("fail count visible to all after quest resolves", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.Quest,
        leaderId: "p1",
        teamPlayerIds: ["p1", "p3"],
        cards: [
          { playerId: "p1", card: QuestCard.Success },
          { playerId: "p3", card: QuestCard.Fail },
        ],
        failCount: 1,
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p2",
      merlinRole,
    );
    expect(result["questFailCount"]).toBe(1);
  });

  it("Assassin sees assassinationTargetIds during Assassination phase", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.Assassination,
        assassinPlayerId: "p5",
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p5",
      assassinRole,
    );
    expect(result["assassinationTargetIds"]).toEqual(["p1", "p2", "p3"]);
  });

  it("non-Assassin does not see assassinationTargetIds during Assassination phase", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.Assassination,
        assassinPlayerId: "p5",
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p1",
      merlinRole,
    );
    expect(result["assassinationTargetIds"]).toBeUndefined();
  });

  it("assassination target visible to all when selected", () => {
    const ts: AvalonTurnState = {
      ...baseTurnState,
      phase: {
        type: AvalonPhase.Assassination,
        assassinPlayerId: "p5",
        targetPlayerId: "p1",
      },
    };
    const result = avalonServices.extractPlayerState(
      makeGame(ts),
      "p2",
      merlinRole,
    );
    expect(result["assassinationTarget"]).toBe("p1");
  });
});
