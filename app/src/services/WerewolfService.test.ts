import { describe, it, expect } from "vitest";
import { werewolfService } from "./WerewolfService";

describe("WerewolfService.defaultRoleCount", () => {
  it("returns correct counts for minimum player count (5)", () => {
    const slots = werewolfService.defaultRoleCount(5);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));

    expect(counts["werewolf-bad"]).toBe(1);
    expect(counts["werewolf-good"]).toBe(4);
    expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(5);
  });

  it("returns correct counts for 10 players", () => {
    const slots = werewolfService.defaultRoleCount(10);
    const counts = Object.fromEntries(slots.map((s) => [s.roleId, s.count]));

    expect(counts["werewolf-bad"]).toBe(3);
    expect(counts["werewolf-good"]).toBe(7);
    expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(10);
  });

  it("total slot count always equals numPlayers", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = werewolfService.defaultRoleCount(n);
      expect(slots.reduce((sum, s) => sum + s.count, 0)).toBe(n);
    }
  });

  it("bad count is approximately one third of players", () => {
    for (let n = 5; n <= 12; n++) {
      const slots = werewolfService.defaultRoleCount(n);
      const bad = slots.find((s) => s.roleId === "werewolf-bad");
      expect(bad?.count).toBe(Math.floor(n / 3));
    }
  });
});
