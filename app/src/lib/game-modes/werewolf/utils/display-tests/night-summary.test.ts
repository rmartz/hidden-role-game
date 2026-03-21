import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import { buildNightSummary, getPhaseLabel } from "../display";
import { SMITE_PHASE_KEY } from "../resolution";
import { targetPlayerIdOf } from "../targeting";

const players = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
];
const roles = {
  seer: { name: "Seer" },
  bodyguard: { name: "Bodyguard" },
  [WerewolfRole.Werewolf]: { name: "Werewolf" },
};

describe("buildNightSummary", () => {
  it("returns an empty array when no actions have targets", () => {
    expect(buildNightSummary({ seer: { votes: [] } }, players, roles)).toEqual(
      [],
    );
  });

  it("returns one entry per targeted player", () => {
    const result = buildNightSummary(
      {
        seer: { targetPlayerId: "p1" },
        bodyguard: { targetPlayerId: "p2" },
      },
      players,
      roles,
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      targetId: "p1",
      playerName: "Alice",
      labels: ["Seer"],
    });
    expect(result[1]).toEqual({
      targetId: "p2",
      playerName: "Bob",
      labels: ["Bodyguard"],
    });
  });

  it("groups multiple roles targeting the same player into one entry", () => {
    const result = buildNightSummary(
      {
        seer: { targetPlayerId: "p1" },
        bodyguard: { targetPlayerId: "p1" },
      },
      players,
      roles,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      targetId: "p1",
      playerName: "Alice",
      labels: ["Seer", "Bodyguard"],
    });
  });

  it("uses suggestedTargetId for group phase actions", () => {
    const result = buildNightSummary(
      {
        [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p2" },
      },
      players,
      roles,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      targetId: "p2",
      playerName: "Bob",
      labels: ["Werewolf"],
    });
  });

  it("falls back to targetId when player is not found", () => {
    const result = buildNightSummary(
      { seer: { targetPlayerId: "unknown" } },
      players,
      roles,
    );
    expect(result[0]).toEqual({
      targetId: "unknown",
      playerName: "unknown",
      labels: ["Seer"],
    });
  });

  it("omits actions with no target", () => {
    const result = buildNightSummary(
      {
        seer: { targetPlayerId: "p1" },
        bodyguard: { votes: [] },
      },
      players,
      roles,
    );
    expect(result).toHaveLength(1);
    expect(result).toContainEqual(expect.objectContaining({ targetId: "p1" }));
  });
});

describe("getPhaseLabel", () => {
  const labelRoles = {
    seer: { name: "Seer" },
    bodyguard: { name: "Bodyguard" },
    [WerewolfRole.Werewolf]: { name: "Werewolf" },
  };

  it("returns the role name for group phase keys (Werewolf)", () => {
    expect(getPhaseLabel(WerewolfRole.Werewolf, labelRoles)).toBe("Werewolf");
  });

  it("returns the role name for known solo role keys", () => {
    expect(getPhaseLabel("seer", labelRoles)).toBe("Seer");
    expect(getPhaseLabel("bodyguard", labelRoles)).toBe("Bodyguard");
  });

  it("returns the raw key as fallback for unknown solo role keys", () => {
    expect(getPhaseLabel("unknown-role", labelRoles)).toBe("unknown-role");
  });

  it('returns "Narrator" for SMITE_PHASE_KEY', () => {
    expect(getPhaseLabel(SMITE_PHASE_KEY, labelRoles)).toBe("Narrator");
  });
});

describe("targetPlayerIdOf", () => {
  it("returns targetPlayerId from a NightAction", () => {
    expect(targetPlayerIdOf({ targetPlayerId: "p1" })).toBe("p1");
  });

  it("returns suggestedTargetId from a TeamNightAction when set", () => {
    expect(targetPlayerIdOf({ votes: [], suggestedTargetId: "p2" })).toBe("p2");
  });

  it("returns undefined from a TeamNightAction with no suggestedTargetId", () => {
    expect(targetPlayerIdOf({ votes: [] })).toBeUndefined();
  });
});
