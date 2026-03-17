import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../roles";
import { isRoleActive } from "./phase-keys";

describe("isRoleActive", () => {
  describe("single role", () => {
    it("returns true when key matches the role", () => {
      expect(isRoleActive(WerewolfRole.Witch, WerewolfRole.Witch)).toBe(true);
    });

    it("returns false when key does not match the role", () => {
      expect(isRoleActive(WerewolfRole.Seer, WerewolfRole.Witch)).toBe(false);
    });

    it("returns false for an unknown string", () => {
      expect(isRoleActive("unknown-role", WerewolfRole.Witch)).toBe(false);
    });

    it("accepts the raw string value of a role (e.g. a player role ID from the database)", () => {
      // myRole.id comes back as a plain string from Firebase — not the TS enum
      // member — so the function must handle raw string values correctly
      expect(
        isRoleActive("werewolf-spellcaster", WerewolfRole.Spellcaster),
      ).toBe(true);
    });
  });

  describe("role list", () => {
    it("returns true when key matches any role in the list", () => {
      expect(
        isRoleActive(WerewolfRole.Witch, [
          WerewolfRole.Witch,
          WerewolfRole.Spellcaster,
        ]),
      ).toBe(true);
      expect(
        isRoleActive(WerewolfRole.Spellcaster, [
          WerewolfRole.Witch,
          WerewolfRole.Spellcaster,
        ]),
      ).toBe(true);
    });

    it("returns false when key matches none of the roles in the list", () => {
      expect(
        isRoleActive(WerewolfRole.Seer, [
          WerewolfRole.Witch,
          WerewolfRole.Spellcaster,
        ]),
      ).toBe(false);
    });

    it("returns false for an unknown string even with a list", () => {
      expect(
        isRoleActive("unknown-role", [
          WerewolfRole.Witch,
          WerewolfRole.Spellcaster,
        ]),
      ).toBe(false);
    });
  });
});
