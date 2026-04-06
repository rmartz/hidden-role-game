import { describe, it, expect } from "vitest";
import {
  adjustRoleSlots,
  validateRoleSlotsForMode,
  validateRoleSlotsCoverPlayerCount,
} from "./role-slots";
import { GameMode } from "@/lib/types";
import type { RoleSlot } from "@/lib/types";
import { SecretVillainRole } from "@/lib/game/modes/secret-villain/roles";

describe("adjustRoleSlots", () => {
  describe("add", () => {
    it("increments the role furthest below its target count", () => {
      const current: RoleSlot[] = [
        { roleId: "good", min: 1, max: 1 },
        { roleId: "bad", min: 1, max: 1 },
      ];
      const target: RoleSlot[] = [
        { roleId: "good", min: 3, max: 3 },
        { roleId: "bad", min: 1, max: 1 },
      ];

      const result = adjustRoleSlots(current, target, "add");

      expect(result).toEqual([
        { roleId: "good", min: 2, max: 2 },
        { roleId: "bad", min: 1, max: 1 },
      ]);
    });

    it("adds a new role entry when the role is not yet in current", () => {
      const current: RoleSlot[] = [{ roleId: "good", min: 1, max: 1 }];
      const target: RoleSlot[] = [
        { roleId: "good", min: 1, max: 1 },
        { roleId: "bad", min: 2, max: 2 },
      ];

      const result = adjustRoleSlots(current, target, "add");

      expect(result).toEqual([
        { roleId: "good", min: 1, max: 1 },
        { roleId: "bad", min: 1, max: 1 },
      ]);
    });

    it("returns current unchanged when no target roles exist", () => {
      const current: RoleSlot[] = [{ roleId: "good", min: 2, max: 2 }];
      const result = adjustRoleSlots(current, [], "add");

      expect(result).toEqual(current);
    });

    it("does not mutate the input arrays", () => {
      const current: RoleSlot[] = [{ roleId: "good", min: 1, max: 1 }];
      const target: RoleSlot[] = [{ roleId: "good", min: 3, max: 3 }];
      const originalCurrent = JSON.stringify(current);

      adjustRoleSlots(current, target, "add");

      expect(JSON.stringify(current)).toBe(originalCurrent);
    });
  });

  describe("remove", () => {
    it("decrements the role furthest above its target count", () => {
      const current: RoleSlot[] = [
        { roleId: "good", min: 4, max: 4 },
        { roleId: "bad", min: 1, max: 1 },
      ];
      const target: RoleSlot[] = [
        { roleId: "good", min: 3, max: 3 },
        { roleId: "bad", min: 1, max: 1 },
      ];

      const result = adjustRoleSlots(current, target, "remove");

      expect(result).toEqual([
        { roleId: "good", min: 3, max: 3 },
        { roleId: "bad", min: 1, max: 1 },
      ]);
    });

    it("removes the slot entirely when its count reaches zero", () => {
      const current: RoleSlot[] = [
        { roleId: "good", min: 3, max: 3 },
        { roleId: "bad", min: 1, max: 1 },
      ];
      const target: RoleSlot[] = [{ roleId: "good", min: 3, max: 3 }];

      const result = adjustRoleSlots(current, target, "remove");

      expect(result).toEqual([{ roleId: "good", min: 3, max: 3 }]);
    });

    it("returns current unchanged when all slot counts are zero", () => {
      const current: RoleSlot[] = [{ roleId: "good", min: 0, max: 0 }];
      const target: RoleSlot[] = [{ roleId: "good", min: 1, max: 1 }];

      const result = adjustRoleSlots(current, target, "remove");

      expect(result).toEqual(current);
    });

    it("returns current unchanged when current is empty", () => {
      const target: RoleSlot[] = [{ roleId: "good", min: 1, max: 1 }];
      const result = adjustRoleSlots([], target, "remove");

      expect(result).toEqual([]);
    });

    it("does not mutate the input arrays", () => {
      const current: RoleSlot[] = [{ roleId: "good", min: 2, max: 2 }];
      const target: RoleSlot[] = [{ roleId: "good", min: 1, max: 1 }];
      const originalCurrent = JSON.stringify(current);

      adjustRoleSlots(current, target, "remove");

      expect(JSON.stringify(current)).toBe(originalCurrent);
    });
  });

  describe("convergence", () => {
    it("reaches the target distribution after the correct number of steps", () => {
      const target: RoleSlot[] = [
        { roleId: "good", min: 3, max: 3 },
        { roleId: "bad", min: 1, max: 1 },
      ];
      let slots: RoleSlot[] = [];

      for (let i = 0; i < 4; i++) {
        slots = adjustRoleSlots(slots, target, "add");
      }

      expect(slots).toEqual(expect.arrayContaining(target));
      expect(slots.reduce((sum, s) => sum + s.min, 0)).toBe(4);
    });
  });
});

describe("validateRoleSlotsCoverPlayerCount", () => {
  // SecretVillain has no custom roleSlotsRequired, so required == playerCount
  it("returns undefined when slots exactly cover the player count", () => {
    const slots: RoleSlot[] = [{ roleId: "r", min: 5, max: 5 }];
    expect(
      validateRoleSlotsCoverPlayerCount(slots, GameMode.SecretVillain, 5),
    ).toBeUndefined();
  });

  it("returns an error when totalMax is less than the required count", () => {
    const slots: RoleSlot[] = [{ roleId: "r", min: 3, max: 4 }];
    expect(
      validateRoleSlotsCoverPlayerCount(slots, GameMode.SecretVillain, 5),
    ).toBeDefined();
  });

  it("returns an error when totalMin exceeds the required count", () => {
    const slots: RoleSlot[] = [{ roleId: "r", min: 6, max: 8 }];
    expect(
      validateRoleSlotsCoverPlayerCount(slots, GameMode.SecretVillain, 5),
    ).toBeDefined();
  });

  it("returns undefined when the player count falls within the slot range", () => {
    const slots: RoleSlot[] = [{ roleId: "r", min: 3, max: 7 }];
    expect(
      validateRoleSlotsCoverPlayerCount(slots, GameMode.SecretVillain, 5),
    ).toBeUndefined();
  });
});

describe("validateRoleSlotsForMode", () => {
  it("returns undefined when all role IDs are valid for the mode", () => {
    const slots: RoleSlot[] = [
      { roleId: SecretVillainRole.Good, min: 3, max: 3 },
      { roleId: SecretVillainRole.Bad, min: 1, max: 1 },
      { roleId: SecretVillainRole.SpecialBad, min: 1, max: 1 },
    ];
    expect(
      validateRoleSlotsForMode(slots, GameMode.SecretVillain),
    ).toBeUndefined();
  });

  it("returns an error message naming the unknown role ID", () => {
    const slots: RoleSlot[] = [
      { roleId: SecretVillainRole.Good, min: 3, max: 3 },
      { roleId: "not-a-real-role", min: 1, max: 1 },
    ];
    const error = validateRoleSlotsForMode(slots, GameMode.SecretVillain);
    expect(error).toBeDefined();
    expect(error).toContain("not-a-real-role");
  });
});
