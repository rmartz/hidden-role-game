import { describe, it, expect } from "vitest";
import { Team } from "@/lib/types";
import { WerewolfRole } from "../roles";
import { getTeamPhaseKey } from "./phase-keys";
import {
  buildNightSummary,
  getPhaseLabel,
  isPlayersTurn,
  getConfirmLabel,
} from "./display";
import { targetPlayerIdOf, getSoloTarget } from "./targeting";

const players = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
];
const roles = { seer: { name: "Seer" }, bodyguard: { name: "Bodyguard" } };

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

  it("uses suggestedTargetId for team actions", () => {
    const result = buildNightSummary(
      { "team:Bad": { votes: [], suggestedTargetId: "p2" } },
      players,
      roles,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      targetId: "p2",
      playerName: "Bob",
      labels: ["Bad Team"],
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
  };

  it("returns '<team> Team' for team phase keys", () => {
    expect(getPhaseLabel("team:Bad", labelRoles)).toBe("Bad Team");
    expect(getPhaseLabel("team:Good", labelRoles)).toBe("Good Team");
  });

  it("returns the role name for known solo role keys", () => {
    expect(getPhaseLabel("seer", labelRoles)).toBe("Seer");
    expect(getPhaseLabel("bodyguard", labelRoles)).toBe("Bodyguard");
  });

  it("returns the raw key as fallback for unknown solo role keys", () => {
    expect(getPhaseLabel("unknown-role", labelRoles)).toBe("unknown-role");
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

describe("getSoloTarget", () => {
  it("returns undefined target and false confirmed when action is undefined", () => {
    expect(getSoloTarget(undefined)).toEqual({
      targetPlayerId: undefined,
      confirmed: false,
    });
  });

  it("returns targetPlayerId and confirmed from a NightAction", () => {
    expect(getSoloTarget({ targetPlayerId: "p1", confirmed: true })).toEqual({
      targetPlayerId: "p1",
      confirmed: true,
    });
  });

  it("defaults confirmed to false when absent in a NightAction", () => {
    expect(getSoloTarget({ targetPlayerId: "p1" })).toEqual({
      targetPlayerId: "p1",
      confirmed: false,
    });
  });

  it("returns suggestedTargetId and confirmed from a TeamNightAction", () => {
    expect(
      getSoloTarget({ votes: [], suggestedTargetId: "p2", confirmed: true }),
    ).toEqual({ targetPlayerId: "p2", confirmed: true });
  });

  it("returns undefined target when TeamNightAction has no suggestedTargetId", () => {
    expect(getSoloTarget({ votes: [] })).toEqual({
      targetPlayerId: undefined,
      confirmed: false,
    });
  });
});

describe("isPlayersTurn", () => {
  it("returns false when myRole is null", () => {
    expect(isPlayersTurn(null, WerewolfRole.Seer)).toBe(false);
  });

  it("returns false when activePhaseKey is undefined", () => {
    expect(
      isPlayersTurn({ id: WerewolfRole.Seer, team: Team.Good }, undefined),
    ).toBe(false);
  });

  it("returns true for a solo phase matching the player's role ID", () => {
    expect(
      isPlayersTurn(
        { id: WerewolfRole.Seer, team: Team.Good },
        WerewolfRole.Seer,
      ),
    ).toBe(true);
  });

  it("returns false for a solo phase that does not match the player's role ID", () => {
    expect(
      isPlayersTurn(
        { id: WerewolfRole.Bodyguard, team: Team.Good },
        WerewolfRole.Seer,
      ),
    ).toBe(false);
  });

  it("returns true for a team phase matching the player's team", () => {
    expect(
      isPlayersTurn(
        { id: WerewolfRole.Werewolf, team: Team.Bad },
        getTeamPhaseKey(Team.Bad),
      ),
    ).toBe(true);
  });

  it("returns false for a team phase that does not match the player's team", () => {
    expect(
      isPlayersTurn(
        { id: WerewolfRole.Seer, team: Team.Good },
        getTeamPhaseKey(Team.Bad),
      ),
    ).toBe(false);
  });
});

describe("getConfirmLabel", () => {
  it("returns 'Attack' for Werewolf", () => {
    expect(getConfirmLabel(WerewolfRole.Werewolf)).toBe("Attack");
  });

  it("returns 'Attack' for Chupacabra", () => {
    expect(getConfirmLabel(WerewolfRole.Chupacabra)).toBe("Attack");
  });

  it("returns 'Protect' for Bodyguard", () => {
    expect(getConfirmLabel(WerewolfRole.Bodyguard)).toBe("Protect");
  });

  it("returns 'Investigate' for Seer", () => {
    expect(getConfirmLabel(WerewolfRole.Seer)).toBe("Investigate");
  });

  it("returns 'Confirm' for Special roles like Witch", () => {
    expect(getConfirmLabel(WerewolfRole.Witch)).toBe("Confirm");
  });

  it("returns 'Confirm' for None roles like Villager", () => {
    expect(getConfirmLabel(WerewolfRole.Villager)).toBe("Confirm");
  });

  it("returns 'Confirm' for undefined roleId", () => {
    expect(getConfirmLabel(undefined)).toBe("Confirm");
  });

  it("returns 'Confirm' for unknown roleId", () => {
    expect(getConfirmLabel("unknown-role")).toBe("Confirm");
  });
});
