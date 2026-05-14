import { describe, expect,it } from "vitest";

import { WerewolfRole } from "../roles";
import { buildNarratorInstruction } from "./narrator-instructions";
import { GROUP_PHASE_KEY_SEPARATOR } from "./phase-keys";

describe("buildNarratorInstruction", () => {
  describe("Werewolf group phase", () => {
    it("returns wake instruction for all Werewolves", () => {
      const activeRoleIds = new Set([WerewolfRole.Werewolf]);
      const result = buildNarratorInstruction(
        WerewolfRole.Werewolf,
        activeRoleIds,
      );
      expect(result?.wakeInstruction).toBe(
        "Tell all Werewolves to open their eyes.",
      );
      expect(result?.postWake).toBe(
        "Tell them to find their teammates and choose a target.",
      );
    });
  });

  describe("Minion", () => {
    it("uses basic werewolf pre-wake when only plain Werewolf is in play", () => {
      const activeRoleIds = new Set([
        WerewolfRole.Werewolf,
        WerewolfRole.Minion,
      ]);
      const result = buildNarratorInstruction(
        WerewolfRole.Minion,
        activeRoleIds,
      );
      expect(result?.preWake).toBe("All Werewolves, raise your thumbs.");
      expect(result?.wakeInstruction).toBe("Tell Minion to open their eyes.");
    });

    it("includes extra werewolf role names when Wolf Cub is in play", () => {
      const activeRoleIds = new Set([
        WerewolfRole.Werewolf,
        WerewolfRole.WolfCub,
        WerewolfRole.Minion,
      ]);
      const result = buildNarratorInstruction(
        WerewolfRole.Minion,
        activeRoleIds,
      );
      expect(result?.preWake).toBe(
        "All Werewolves, including Wolf Cub, raise your thumbs.",
      );
    });

    it("includes Lone Wolf in the pre-wake when in play", () => {
      const activeRoleIds = new Set([
        WerewolfRole.Werewolf,
        WerewolfRole.LoneWolf,
        WerewolfRole.Minion,
      ]);
      const result = buildNarratorInstruction(
        WerewolfRole.Minion,
        activeRoleIds,
      );
      expect(result?.preWake).toBe(
        "All Werewolves, including Lone Wolf, raise your thumbs.",
      );
    });
  });

  describe("Sentinel", () => {
    it("tells the Seer to raise their thumb when the Seer is in play", () => {
      const activeRoleIds = new Set([WerewolfRole.Seer, WerewolfRole.Sentinel]);
      const result = buildNarratorInstruction(
        WerewolfRole.Sentinel,
        activeRoleIds,
      );
      expect(result?.preWake).toBe("Tell the Seer to raise their thumb.");
      expect(result?.wakeInstruction).toBe("Tell Sentinel to open their eyes.");
    });

    it("omits preWake when the Seer is not in play", () => {
      const activeRoleIds = new Set([WerewolfRole.Sentinel]);
      const result = buildNarratorInstruction(
        WerewolfRole.Sentinel,
        activeRoleIds,
      );
      expect(result?.preWake).toBeUndefined();
    });
  });

  describe("Mason", () => {
    it("tells all Masons to open their eyes and find each other", () => {
      const activeRoleIds = new Set([WerewolfRole.Mason]);
      const result = buildNarratorInstruction(
        WerewolfRole.Mason,
        activeRoleIds,
      );
      expect(result?.wakeInstruction).toBe(
        "Tell all Masons to open their eyes.",
      );
      expect(result?.postWake).toBe("Tell them to find each other.");
    });
  });

  describe("roles with night activity", () => {
    it("tells the Seer to look at the Narrator", () => {
      const activeRoleIds = new Set([WerewolfRole.Seer]);
      const result = buildNarratorInstruction(WerewolfRole.Seer, activeRoleIds);
      expect(result?.wakeInstruction).toBe("Tell Seer to open their eyes.");
      expect(result?.postWake).toBe("Tell them to look at the Narrator.");
    });

    it("tells the Doctor to look at the Narrator", () => {
      const activeRoleIds = new Set([WerewolfRole.Doctor]);
      const result = buildNarratorInstruction(
        WerewolfRole.Doctor,
        activeRoleIds,
      );
      expect(result?.wakeInstruction).toBe("Tell Doctor to open their eyes.");
      expect(result?.postWake).toBe("Tell them to look at the Narrator.");
    });
  });

  describe("roles with no night activity", () => {
    it("gives a basic wake instruction for Elusive Seer", () => {
      const activeRoleIds = new Set([WerewolfRole.ElusiveSeer]);
      const result = buildNarratorInstruction(
        WerewolfRole.ElusiveSeer,
        activeRoleIds,
      );
      expect(result?.wakeInstruction).toBe(
        "Tell Elusive Seer to open their eyes.",
      );
      expect(result?.postWake).toBeUndefined();
    });
  });

  describe("group phase key with suffix", () => {
    it("normalizes a suffixed group phase key to the base role", () => {
      const suffixedKey = `${WerewolfRole.Werewolf}${GROUP_PHASE_KEY_SEPARATOR}2`;
      const activeRoleIds = new Set([WerewolfRole.Werewolf]);
      const result = buildNarratorInstruction(suffixedKey, activeRoleIds);
      expect(result?.wakeInstruction).toBe(
        "Tell all Werewolves to open their eyes.",
      );
      expect(result?.postWake).toBe(
        "Tell them to find their teammates and choose a target.",
      );
    });
  });

  describe("unknown phase key", () => {
    it("returns undefined for an unrecognized phase key", () => {
      const result = buildNarratorInstruction("unknown-role", new Set());
      expect(result).toBeUndefined();
    });
  });
});
