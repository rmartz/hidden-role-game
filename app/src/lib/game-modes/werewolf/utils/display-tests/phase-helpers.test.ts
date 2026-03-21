import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import { isPlayersTurn, getConfirmLabel } from "../display";
import { getSoloTarget } from "../targeting";

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
