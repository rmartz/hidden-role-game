import { describe, expect, it } from "vitest";

import { avalonServices } from "../services";
import type { AvalonTurnState } from "../types";
import { AvalonPhase, QuestCard } from "../types";
import {
  assassinRole,
  baseTurnState,
  makeGame,
  merlinRole,
  playerIds,
} from "./helpers";

describe("extractPlayerState — quest and assassination", () => {
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
    expect(result["assassinationTargetIds"]).toEqual(playerIds);
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
