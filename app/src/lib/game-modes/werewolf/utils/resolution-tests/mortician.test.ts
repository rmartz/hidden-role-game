import { describe, it, expect } from "vitest";
import { WerewolfRole, WEREWOLF_ROLES } from "../../roles";
import { resolveNightActions } from "../resolution";
import { findKilled } from "./helpers";

describe("resolveNightActions", () => {
  describe("Mortician", () => {
    const morticianAssignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "mort1", roleDefinitionId: WerewolfRole.Mortician },
      { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
    ];

    it("kills an unprotected target", () => {
      const events = resolveNightActions(
        { [WerewolfRole.Mortician]: { targetPlayerId: "p1" } },
        morticianAssignments,
        [],
      );
      expect(findKilled(events, "p1")).toMatchObject({ died: true });
    });

    it("attack is blocked when target is protected by Bodyguard", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Mortician]: { targetPlayerId: "p1" },
          [WerewolfRole.Bodyguard]: { targetPlayerId: "p1" },
        },
        morticianAssignments,
        [],
      );
      const killEvent = findKilled(events, "p1");
      expect(killEvent).toMatchObject({ died: false });
    });

    it("Mortician role definition has preventSelfTarget set", () => {
      // resolveNightActions doesn't enforce preventSelfTarget — that's a UI/serialization
      // concern. This test documents that the role definition has preventSelfTarget set.
      expect(WEREWOLF_ROLES[WerewolfRole.Mortician].preventSelfTarget).toBe(
        true,
      );
    });
  });
});
