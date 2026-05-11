import { describe, it, expect } from "vitest";
import { AvalonRole } from "../roles";
import type { QuestResult } from "../types";
import {
  AvalonWinner,
  checkQuestWinCondition,
  checkRejectionWinCondition,
  checkAssassinationResult,
} from "./win-condition";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeQuestResult(overrides: Partial<QuestResult> = {}): QuestResult {
  return {
    questNumber: 1,
    teamSize: 2,
    teamPlayerIds: ["p1", "p2"],
    failCount: 0,
    succeeded: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// checkQuestWinCondition
// ---------------------------------------------------------------------------

describe("checkQuestWinCondition", () => {
  describe("Good wins with 3 successes", () => {
    it("returns Good when exactly 3 quests succeeded", () => {
      const questResults: QuestResult[] = [
        makeQuestResult({ questNumber: 1, succeeded: true }),
        makeQuestResult({ questNumber: 2, succeeded: true }),
        makeQuestResult({ questNumber: 3, succeeded: true }),
      ];
      expect(checkQuestWinCondition(questResults)).toBe(AvalonWinner.Good);
    });

    it("returns Good when 3 quests succeeded and 2 failed", () => {
      const questResults: QuestResult[] = [
        makeQuestResult({ questNumber: 1, succeeded: false }),
        makeQuestResult({ questNumber: 2, succeeded: true }),
        makeQuestResult({ questNumber: 3, succeeded: false }),
        makeQuestResult({ questNumber: 4, succeeded: true }),
        makeQuestResult({ questNumber: 5, succeeded: true }),
      ];
      expect(checkQuestWinCondition(questResults)).toBe(AvalonWinner.Good);
    });
  });

  describe("Evil wins with 3 failures", () => {
    it("returns Evil when exactly 3 quests failed", () => {
      const questResults: QuestResult[] = [
        makeQuestResult({ questNumber: 1, succeeded: false }),
        makeQuestResult({ questNumber: 2, succeeded: false }),
        makeQuestResult({ questNumber: 3, succeeded: false }),
      ];
      expect(checkQuestWinCondition(questResults)).toBe(AvalonWinner.Evil);
    });

    it("returns Evil when 3 quests failed and 2 succeeded", () => {
      const questResults: QuestResult[] = [
        makeQuestResult({ questNumber: 1, succeeded: true }),
        makeQuestResult({ questNumber: 2, succeeded: false }),
        makeQuestResult({ questNumber: 3, succeeded: true }),
        makeQuestResult({ questNumber: 4, succeeded: false }),
        makeQuestResult({ questNumber: 5, succeeded: false }),
      ];
      expect(checkQuestWinCondition(questResults)).toBe(AvalonWinner.Evil);
    });
  });

  describe("no winner yet", () => {
    it("returns undefined when fewer than 3 quests have resolved", () => {
      const questResults: QuestResult[] = [
        makeQuestResult({ questNumber: 1, succeeded: true }),
        makeQuestResult({ questNumber: 2, succeeded: false }),
      ];
      expect(checkQuestWinCondition(questResults)).toBeUndefined();
    });

    it("returns undefined for an empty quest list", () => {
      expect(checkQuestWinCondition([])).toBeUndefined();
    });

    it("returns undefined when each side has 2 outcomes", () => {
      const questResults: QuestResult[] = [
        makeQuestResult({ questNumber: 1, succeeded: true }),
        makeQuestResult({ questNumber: 2, succeeded: false }),
        makeQuestResult({ questNumber: 3, succeeded: true }),
        makeQuestResult({ questNumber: 4, succeeded: false }),
      ];
      expect(checkQuestWinCondition(questResults)).toBeUndefined();
    });
  });
});

// ---------------------------------------------------------------------------
// checkRejectionWinCondition
// ---------------------------------------------------------------------------

describe("checkRejectionWinCondition", () => {
  it("returns Evil when consecutiveRejections reaches 5", () => {
    expect(checkRejectionWinCondition(5)).toBe(AvalonWinner.Evil);
  });

  it("returns Evil when consecutiveRejections exceeds 5", () => {
    expect(checkRejectionWinCondition(6)).toBe(AvalonWinner.Evil);
  });

  it("returns undefined when consecutiveRejections is 4", () => {
    expect(checkRejectionWinCondition(4)).toBeUndefined();
  });

  it("returns undefined when consecutiveRejections is 0", () => {
    expect(checkRejectionWinCondition(0)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// checkAssassinationResult
// ---------------------------------------------------------------------------

describe("checkAssassinationResult", () => {
  const roleAssignments = [
    { playerId: "p1", roleDefinitionId: AvalonRole.Merlin },
    { playerId: "p2", roleDefinitionId: AvalonRole.LoyalServant },
    { playerId: "p3", roleDefinitionId: AvalonRole.LoyalServant },
    { playerId: "p4", roleDefinitionId: AvalonRole.MinionOfMordred },
    { playerId: "p5", roleDefinitionId: AvalonRole.Assassin },
  ];

  it("returns Evil when the target is Merlin", () => {
    expect(checkAssassinationResult("p1", roleAssignments)).toBe(
      AvalonWinner.Evil,
    );
  });

  it("returns Good when the target is not Merlin", () => {
    expect(checkAssassinationResult("p2", roleAssignments)).toBe(
      AvalonWinner.Good,
    );
  });

  it("returns Good when the target is an Evil player", () => {
    expect(checkAssassinationResult("p4", roleAssignments)).toBe(
      AvalonWinner.Good,
    );
  });

  it("returns Good when the target is the Assassin themselves", () => {
    expect(checkAssassinationResult("p5", roleAssignments)).toBe(
      AvalonWinner.Good,
    );
  });

  it("returns Good when Merlin is not in the role assignments", () => {
    const noMerlinAssignments = [
      { playerId: "p1", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p2", roleDefinitionId: AvalonRole.LoyalServant },
      { playerId: "p3", roleDefinitionId: AvalonRole.MinionOfMordred },
    ];
    expect(checkAssassinationResult("p1", noMerlinAssignments)).toBe(
      AvalonWinner.Good,
    );
  });
});
