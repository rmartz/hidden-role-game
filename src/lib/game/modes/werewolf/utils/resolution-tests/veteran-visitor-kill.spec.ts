import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import { resolveNightActions } from "../resolution";
import { findKilled } from "./helpers";

describe("resolveNightActions", () => {
  describe("Veteran — visitor counter-kill", () => {
    const veteranAssignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
      { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
      { playerId: "doc1", roleDefinitionId: WerewolfRole.Doctor },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
    ];

    it("alerts and Bodyguard visits: Bodyguard dies, Veteran survives unprotected", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Bodyguard]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        veteranAssignments,
        [],
      );

      const bgEvent = findKilled(events, "bg1");
      expect(bgEvent).toMatchObject({
        died: true,
        attackedBy: expect.arrayContaining([WerewolfRole.Veteran]),
      });

      const vetEvent = findKilled(events, "vet1");
      expect(vetEvent).toBeUndefined();

      const counterkilledEvent = events.find(
        (e) => e.type === "veteran-counterkilled",
      );
      expect(counterkilledEvent).toMatchObject({
        type: "veteran-counterkilled",
        counterkilledPlayerId: "bg1",
        veteranPlayerId: "vet1",
        source: "visitor",
      });
    });

    it("alerts and Doctor visits: Doctor dies", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Doctor]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        veteranAssignments,
        [],
      );

      const docEvent = findKilled(events, "doc1");
      expect(docEvent).toMatchObject({ died: true });

      const counterkilledEvent = events.find(
        (e) => e.type === "veteran-counterkilled",
      );
      expect(counterkilledEvent).toMatchObject({
        counterkilledPlayerId: "doc1",
        source: "visitor",
      });
    });

    it("alerts and Vigilante targets Veteran: Vigilante dies", () => {
      const vigilanteAssignments = [
        { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
        { playerId: "vig1", roleDefinitionId: WerewolfRole.Vigilante },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      ];

      const events = resolveNightActions(
        {
          [WerewolfRole.Vigilante]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        vigilanteAssignments,
        [],
      );

      const vigEvent = findKilled(events, "vig1");
      expect(vigEvent).toMatchObject({
        died: true,
        attackedBy: expect.arrayContaining([WerewolfRole.Veteran]),
      });

      const vetEvent = findKilled(events, "vet1");
      expect(vetEvent).toBeUndefined();

      const counterkilledEvent = events.find(
        (e) => e.type === "veteran-counterkilled",
      );
      expect(counterkilledEvent).toMatchObject({
        counterkilledPlayerId: "vig1",
        veteranPlayerId: "vet1",
        source: "visitor",
      });
    });

    it("alerts and Bodyguard visits while Doctor protects Bodyguard: counter-kill absorbed, died is false", () => {
      // The Doctor protects the Bodyguard, so the Veteran's counter-kill is
      // absorbed and the Bodyguard survives. The veteran-counterkilled event
      // should reflect died: false (matching the killed event outcome).
      const events = resolveNightActions(
        {
          [WerewolfRole.Bodyguard]: { targetPlayerId: "vet1" },
          [WerewolfRole.Doctor]: { targetPlayerId: "bg1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        veteranAssignments,
        [],
      );

      const bgKilled = findKilled(events, "bg1");
      expect(bgKilled).toMatchObject({ died: false });

      const counterkilledEvent = events.find(
        (e) => e.type === "veteran-counterkilled",
      );
      expect(counterkilledEvent).toMatchObject({
        counterkilledPlayerId: "bg1",
        veteranPlayerId: "vet1",
        source: "visitor",
        died: false,
      });
    });

    it("alerts and uncharged Mirrorcaster targets Veteran: Mirrorcaster is counter-killed", () => {
      // Mirrorcaster is TargetCategory.Special but acts as a physical Protect
      // visit when uncharged — it should be counter-killed like a Bodyguard.
      const mirrorcasterAssignments = [
        { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
        { playerId: "mc1", roleDefinitionId: WerewolfRole.Mirrorcaster },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      ];

      const events = resolveNightActions(
        {
          [WerewolfRole.Mirrorcaster]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        mirrorcasterAssignments,
        [],
        undefined,
        { mirrorcasterCharged: false },
      );

      const mcKilled = findKilled(events, "mc1");
      expect(mcKilled).toMatchObject({
        died: true,
        attackedBy: expect.arrayContaining([WerewolfRole.Veteran]),
      });

      const vetKilled = findKilled(events, "vet1");
      expect(vetKilled).toBeUndefined();

      expect(
        events.find((e) => e.type === "veteran-counterkilled"),
      ).toMatchObject({
        counterkilledPlayerId: "mc1",
        veteranPlayerId: "vet1",
        source: "visitor",
      });
    });

    it("alerts and charged Mirrorcaster targets Veteran: Mirrorcaster is counter-killed", () => {
      // Charged Mirrorcaster acts as an Attack visit — should be counter-killed.
      const mirrorcasterAssignments = [
        { playerId: "vet1", roleDefinitionId: WerewolfRole.Veteran },
        { playerId: "mc1", roleDefinitionId: WerewolfRole.Mirrorcaster },
        { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
      ];

      const events = resolveNightActions(
        {
          [WerewolfRole.Mirrorcaster]: { targetPlayerId: "vet1" },
          [WerewolfRole.Veteran]: { alerted: true },
        },
        mirrorcasterAssignments,
        [],
        undefined,
        { mirrorcasterCharged: true },
      );

      const mcKilled = findKilled(events, "mc1");
      expect(mcKilled).toMatchObject({
        died: true,
        attackedBy: expect.arrayContaining([WerewolfRole.Veteran]),
      });

      const vetKilled = findKilled(events, "vet1");
      expect(vetKilled).toBeUndefined();

      expect(
        events.find((e) => e.type === "veteran-counterkilled"),
      ).toMatchObject({
        counterkilledPlayerId: "mc1",
        veteranPlayerId: "vet1",
        source: "visitor",
      });
    });
  });
});
