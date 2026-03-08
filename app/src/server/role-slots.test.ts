import { describe, it, expect } from "vitest";
import { adjustRoleSlots } from "./role-slots";
import type { RoleSlot } from "@/lib/models";

describe("adjustRoleSlots", () => {
  describe("add", () => {
    it("increments the role furthest below its target count", () => {
      const current: RoleSlot[] = [
        { roleId: "good", count: 1 },
        { roleId: "bad", count: 1 },
      ];
      const target: RoleSlot[] = [
        { roleId: "good", count: 3 },
        { roleId: "bad", count: 1 },
      ];

      const result = adjustRoleSlots(current, target, "add");

      expect(result).toEqual([
        { roleId: "good", count: 2 },
        { roleId: "bad", count: 1 },
      ]);
    });

    it("adds a new role entry when the role is not yet in current", () => {
      const current: RoleSlot[] = [{ roleId: "good", count: 1 }];
      const target: RoleSlot[] = [
        { roleId: "good", count: 1 },
        { roleId: "bad", count: 2 },
      ];

      const result = adjustRoleSlots(current, target, "add");

      expect(result).toEqual([
        { roleId: "good", count: 1 },
        { roleId: "bad", count: 1 },
      ]);
    });

    it("returns current unchanged when no target roles exist", () => {
      const current: RoleSlot[] = [{ roleId: "good", count: 2 }];
      const result = adjustRoleSlots(current, [], "add");

      expect(result).toEqual(current);
    });

    it("does not mutate the input arrays", () => {
      const current: RoleSlot[] = [{ roleId: "good", count: 1 }];
      const target: RoleSlot[] = [{ roleId: "good", count: 3 }];
      const originalCurrent = JSON.stringify(current);

      adjustRoleSlots(current, target, "add");

      expect(JSON.stringify(current)).toBe(originalCurrent);
    });
  });

  describe("remove", () => {
    it("decrements the role furthest above its target count", () => {
      const current: RoleSlot[] = [
        { roleId: "good", count: 4 },
        { roleId: "bad", count: 1 },
      ];
      const target: RoleSlot[] = [
        { roleId: "good", count: 3 },
        { roleId: "bad", count: 1 },
      ];

      const result = adjustRoleSlots(current, target, "remove");

      expect(result).toEqual([
        { roleId: "good", count: 3 },
        { roleId: "bad", count: 1 },
      ]);
    });

    it("removes the slot entirely when its count reaches zero", () => {
      const current: RoleSlot[] = [
        { roleId: "good", count: 3 },
        { roleId: "bad", count: 1 },
      ];
      const target: RoleSlot[] = [{ roleId: "good", count: 3 }];

      const result = adjustRoleSlots(current, target, "remove");

      expect(result).toEqual([{ roleId: "good", count: 3 }]);
    });

    it("returns current unchanged when all slot counts are zero", () => {
      const current: RoleSlot[] = [{ roleId: "good", count: 0 }];
      const target: RoleSlot[] = [{ roleId: "good", count: 1 }];

      const result = adjustRoleSlots(current, target, "remove");

      expect(result).toEqual(current);
    });

    it("returns current unchanged when current is empty", () => {
      const target: RoleSlot[] = [{ roleId: "good", count: 1 }];
      const result = adjustRoleSlots([], target, "remove");

      expect(result).toEqual([]);
    });

    it("does not mutate the input arrays", () => {
      const current: RoleSlot[] = [{ roleId: "good", count: 2 }];
      const target: RoleSlot[] = [{ roleId: "good", count: 1 }];
      const originalCurrent = JSON.stringify(current);

      adjustRoleSlots(current, target, "remove");

      expect(JSON.stringify(current)).toBe(originalCurrent);
    });
  });

  describe("convergence", () => {
    it("reaches the target distribution after the correct number of steps", () => {
      const target: RoleSlot[] = [
        { roleId: "good", count: 3 },
        { roleId: "bad", count: 1 },
      ];
      let slots: RoleSlot[] = [];

      for (let i = 0; i < 4; i++) {
        slots = adjustRoleSlots(slots, target, "add");
      }

      expect(slots).toEqual(expect.arrayContaining(target));
      expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(4);
    });
  });
});
