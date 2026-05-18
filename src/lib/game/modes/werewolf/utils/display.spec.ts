import { describe, expect, it } from "vitest";

import { Team } from "@/lib/types";

import { WEREWOLF_COPY } from "../copy";
import { WEREWOLF_ROLES, WerewolfRole } from "../roles";
import {
  buildNightSummary,
  getConfirmLabel,
  getInvestigationResultForNarrator,
  getPhaseLabel,
  isPlayersTurn,
} from "./display";
import { SMITE_PHASE_KEY } from "./resolution";
import { getSoloTarget, targetPlayerIdOf } from "./targeting";

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
  it("returns false when myRole is undefined", () => {
    expect(isPlayersTurn(undefined, WerewolfRole.Seer)).toBe(false);
  });

  it("returns false when activePhaseKey is undefined", () => {
    expect(isPlayersTurn({ id: WerewolfRole.Seer }, undefined)).toBe(false);
  });

  it("returns true for a solo phase matching the player's role ID", () => {
    expect(isPlayersTurn({ id: WerewolfRole.Seer }, WerewolfRole.Seer)).toBe(
      true,
    );
  });

  it("returns false for a solo phase that does not match the player's role ID", () => {
    expect(
      isPlayersTurn({ id: WerewolfRole.Bodyguard }, WerewolfRole.Seer),
    ).toBe(false);
  });

  it("returns true for a Werewolf player during the Werewolf group phase", () => {
    expect(
      isPlayersTurn({ id: WerewolfRole.Werewolf }, WerewolfRole.Werewolf),
    ).toBe(true);
  });

  it("returns true for a Wolf Cub during the Werewolf group phase (wakesWith)", () => {
    expect(
      isPlayersTurn({ id: WerewolfRole.WolfCub }, WerewolfRole.Werewolf),
    ).toBe(true);
  });

  it("returns false for a Seer during the Werewolf group phase", () => {
    expect(
      isPlayersTurn({ id: WerewolfRole.Seer }, WerewolfRole.Werewolf),
    ).toBe(false);
  });
});

describe("getConfirmLabel", () => {
  it("returns 'Attack' for Werewolf", () => {
    expect(getConfirmLabel(WerewolfRole.Werewolf)).toBe("Attack");
  });

  it("returns 'Attack' for Wolf Cub", () => {
    expect(getConfirmLabel(WerewolfRole.WolfCub)).toBe("Attack");
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

  it("returns 'Use Ability' for Witch with no selected target", () => {
    expect(getConfirmLabel(WerewolfRole.Witch)).toBe("Use Ability");
  });

  it("returns 'Use Ability' for Witch when witchContext has no selectedTargetId", () => {
    expect(
      getConfirmLabel(WerewolfRole.Witch, {
        selectedTargetId: undefined,
        attackedPlayerIds: ["p1"],
      }),
    ).toBe("Use Ability");
  });

  it("returns 'Protect' for Witch when selected target is under attack", () => {
    expect(
      getConfirmLabel(WerewolfRole.Witch, {
        selectedTargetId: "p1",
        attackedPlayerIds: ["p1", "p2"],
      }),
    ).toBe("Protect");
  });

  it("returns 'Attack' for Witch when selected target is not under attack", () => {
    expect(
      getConfirmLabel(WerewolfRole.Witch, {
        selectedTargetId: "p3",
        attackedPlayerIds: ["p1"],
      }),
    ).toBe("Attack");
  });

  it("returns 'Silence' for Spellcaster", () => {
    expect(getConfirmLabel(WerewolfRole.Spellcaster)).toBe("Silence");
  });

  it("returns 'Knight' for Monarch", () => {
    expect(getConfirmLabel(WerewolfRole.Monarch)).toBe("Knight");
  });

  it("returns 'Confirm' for None roles like Villager", () => {
    expect(getConfirmLabel(WerewolfRole.Villager)).toBe("Confirm");
  });

  it("returns 'Protect' for Mirrorcaster when uncharged", () => {
    expect(getConfirmLabel(WerewolfRole.Mirrorcaster, undefined, false)).toBe(
      "Protect",
    );
  });

  it("returns 'Protect' for Mirrorcaster when mirrorcasterCharged is undefined", () => {
    expect(
      getConfirmLabel(WerewolfRole.Mirrorcaster, undefined, undefined),
    ).toBe("Protect");
  });

  it("returns 'Attack' for Mirrorcaster when charged", () => {
    expect(getConfirmLabel(WerewolfRole.Mirrorcaster, undefined, true)).toBe(
      "Attack",
    );
  });

  it("returns 'Protect' for Mercenary when uncharged", () => {
    expect(
      getConfirmLabel(WerewolfRole.Mercenary, undefined, undefined, false),
    ).toBe("Protect");
  });

  it("returns 'Protect' for Mercenary when mercenaryCharged is undefined", () => {
    expect(
      getConfirmLabel(WerewolfRole.Mercenary, undefined, undefined, undefined),
    ).toBe("Protect");
  });

  it("returns 'Bribe' for Mercenary when charged", () => {
    expect(
      getConfirmLabel(WerewolfRole.Mercenary, undefined, undefined, true),
    ).toBe("Bribe");
  });

  it("returns 'Confirm' for undefined roleId", () => {
    expect(getConfirmLabel(undefined)).toBe("Confirm");
  });

  it("returns 'Confirm' for unknown roleId", () => {
    expect(getConfirmLabel("unknown-role")).toBe("Confirm");
  });
});

// ---------------------------------------------------------------------------
// getInvestigationResultForNarrator
// ---------------------------------------------------------------------------

describe("getInvestigationResultForNarrator", () => {
  const seerRole = WEREWOLF_ROLES[WerewolfRole.Seer];
  const mysticSeerRole = WEREWOLF_ROLES[WerewolfRole.MysticSeer];

  const wolfAssignment = {
    player: { id: "wolf1", name: "Wolf" },
    reason: "revealed" as const,
    role: { id: WerewolfRole.Werewolf, name: "Werewolf", team: Team.Bad },
  };
  const villagerAssignment = {
    player: { id: "v1", name: "Villager" },
    reason: "revealed" as const,
    role: { id: WerewolfRole.Villager, name: "Villager", team: Team.Good },
  };
  const minionAssignment = {
    player: { id: "minion1", name: "Minion" },
    reason: "revealed" as const,
    role: { id: WerewolfRole.Minion, name: "Minion", team: Team.Bad },
  };

  it("returns undefined when isInvestigatePhase is false", () => {
    expect(
      getInvestigationResultForNarrator(
        false,
        "wolf1",
        true,
        "Wolf",
        [wolfAssignment],
        seerRole,
      ),
    ).toBeUndefined();
  });

  it("returns undefined when activeTarget is undefined", () => {
    expect(
      getInvestigationResultForNarrator(
        true,
        undefined,
        true,
        undefined,
        [wolfAssignment],
        seerRole,
      ),
    ).toBeUndefined();
  });

  it("returns undefined when activeTargetConfirmed is false", () => {
    expect(
      getInvestigationResultForNarrator(
        true,
        "wolf1",
        false,
        "Wolf",
        [wolfAssignment],
        seerRole,
      ),
    ).toBeUndefined();
  });

  it("returns isWerewolfTeam true for a Werewolf target (Seer investigation)", () => {
    const result = getInvestigationResultForNarrator(
      true,
      "wolf1",
      true,
      "Wolf",
      [wolfAssignment],
      seerRole,
    );
    expect(result?.isWerewolfTeam).toBe(true);
    expect(result?.targetName).toBe("Wolf");
    expect(result?.illusionFlipLabel).toBeUndefined();
  });

  it("returns isWerewolfTeam false for a Villager target", () => {
    const result = getInvestigationResultForNarrator(
      true,
      "v1",
      true,
      "Villager",
      [villagerAssignment],
      seerRole,
    );
    expect(result?.isWerewolfTeam).toBe(false);
    expect(result?.illusionFlipLabel).toBeUndefined();
  });

  it("flips result and adds annotation when Illusion Artist targets the same player", () => {
    // wolf1 is Werewolf, but Illusion Artist has targeted wolf1 → Seer sees false
    const result = getInvestigationResultForNarrator(
      true,
      "wolf1",
      true,
      "Wolf",
      [wolfAssignment],
      seerRole,
      undefined,
      undefined,
      "wolf1", // illusionTargetId
    );
    expect(result?.isWerewolfTeam).toBe(false);
    expect(result?.illusionFlipLabel).toBe(
      WEREWOLF_COPY.illusionArtist.narratorFlipAnnotation(
        WEREWOLF_COPY.narrator.seerAlignmentStatus(true),
      ),
    );
  });

  it("flip annotation uses seerAlignmentStatus not teamStatus for a non-wolf Bad-team target (Minion)", () => {
    // Minion: Bad team, but isWerewolf=false. The Illusion Artist flips a "not a Werewolf" to "Werewolf".
    // Annotation should say "Flipped from actual: Not a Werewolf", not "Flipped from actual: not Evil".
    const result = getInvestigationResultForNarrator(
      true,
      "minion1",
      true,
      "Minion",
      [minionAssignment],
      seerRole,
      undefined,
      undefined,
      "minion1", // illusionTargetId
    );
    expect(result?.isWerewolfTeam).toBe(true); // flipped from false
    expect(result?.illusionFlipLabel).toBe(
      WEREWOLF_COPY.illusionArtist.narratorFlipAnnotation(
        WEREWOLF_COPY.narrator.seerAlignmentStatus(false),
      ),
    );
    // Ensure it does NOT say "not Evil"
    expect(result?.illusionFlipLabel).not.toContain(
      WEREWOLF_COPY.narrator.teamStatus(false),
    );
  });

  it("does not flip result when Illusion Artist targets a different player", () => {
    const result = getInvestigationResultForNarrator(
      true,
      "wolf1",
      true,
      "Wolf",
      [wolfAssignment],
      seerRole,
      undefined,
      undefined,
      "v1", // illusionTargetId is different from activeTarget
    );
    expect(result?.isWerewolfTeam).toBe(true);
    expect(result?.illusionFlipLabel).toBeUndefined();
  });

  it("applies roleOverrides for Seer result — overridden Villager shows as Werewolf", () => {
    // v1 is originally Villager but Alpha Wolf converted them
    const result = getInvestigationResultForNarrator(
      true,
      "v1",
      true,
      "Villager",
      [villagerAssignment],
      seerRole,
      undefined,
      undefined,
      undefined,
      { v1: WerewolfRole.Werewolf }, // roleOverrides
    );
    expect(result?.isWerewolfTeam).toBe(true);
  });

  it("applies roleOverrides for Mystic Seer — resultLabel uses effective role name", () => {
    // v1 was originally Villager, but is overridden to Werewolf
    const result = getInvestigationResultForNarrator(
      true,
      "v1",
      true,
      "Villager",
      [villagerAssignment],
      mysticSeerRole,
      undefined,
      undefined,
      undefined,
      { v1: WerewolfRole.Werewolf }, // roleOverrides
    );
    // After override the effective role is Werewolf
    expect(result?.resultLabel).toBe("Werewolf");
    expect(result?.isWerewolfTeam).toBe(true);
  });

  it("Mystic Seer without roleOverrides shows original role name", () => {
    const result = getInvestigationResultForNarrator(
      true,
      "v1",
      true,
      "Villager",
      [villagerAssignment],
      mysticSeerRole,
    );
    expect(result?.resultLabel).toBe("Villager");
    expect(result?.isWerewolfTeam).toBe(false);
  });
});
