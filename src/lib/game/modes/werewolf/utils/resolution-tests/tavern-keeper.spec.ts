import { describe, expect, it } from "vitest";

import { WerewolfRole } from "../../roles";
import { resolveNightActions } from "../resolution";

const assignments = [
  { playerId: "tk1", roleDefinitionId: WerewolfRole.TavernKeeper },
  { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
  { playerId: "wc1", roleDefinitionId: WerewolfRole.WolfCub },
  { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
  { playerId: "sc1", roleDefinitionId: WerewolfRole.Spellcaster },
  { playerId: "seer1", roleDefinitionId: WerewolfRole.Seer },
  { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
  { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
];

describe("resolveNightActions — Tavern Keeper hangover mechanic", () => {
  it("emits a hangover event for the TK's target", () => {
    const events = resolveNightActions(
      {
        [WerewolfRole.TavernKeeper]: { targetPlayerId: "bg1", confirmed: true },
        [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
      },
      assignments,
      [],
    );
    const hangover = events.find(
      (e) => e.type === "hangover" && e.targetPlayerId === "bg1",
    );
    expect(hangover).toBeDefined();
  });

  it("undoes the bodyguard protection when bodyguard is the TK's target", () => {
    // Bodyguard targets p1; TK targets bodyguard → bodyguard's protection should be undone.
    // Werewolf attacks p1 → p1 should die (not protected).
    const events = resolveNightActions(
      {
        [WerewolfRole.TavernKeeper]: { targetPlayerId: "bg1", confirmed: true },
        [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
        [WerewolfRole.Bodyguard]: { targetPlayerId: "p1", confirmed: true },
      },
      assignments,
      [],
    );
    const killed = events.find(
      (e) => e.type === "killed" && e.targetPlayerId === "p1",
    );
    expect(killed).toBeDefined();
    expect(killed?.type === "killed" && killed.died).toBe(true);
  });

  it("does not undo an investigative role action (Seer is exempt)", () => {
    // TK targets the Seer — Seer's action should NOT be removed.
    // Spellcaster also has an action in this scenario, but TK only targets the Seer.
    const events = resolveNightActions(
      {
        [WerewolfRole.TavernKeeper]: {
          targetPlayerId: "seer1",
          confirmed: true,
        },
        [WerewolfRole.Spellcaster]: { targetPlayerId: "p1", confirmed: true },
      },
      assignments,
      [],
    );
    // Seer is investigative — no hangover event
    const seerHangover = events.find(
      (e) => e.type === "hangover" && e.targetPlayerId === "seer1",
    );
    expect(seerHangover).toBeUndefined();
    // No hangover at all since the only candidate is exempt
    const anyHangover = events.find((e) => e.type === "hangover");
    expect(anyHangover).toBeUndefined();
  });

  it("still applies TK's own confirmed action during resolution", () => {
    // TK's action should not be removed from resolvedNightActions (only the target's).
    // We verify indirectly: hangover event is emitted, meaning TK's action was read.
    const events = resolveNightActions(
      {
        [WerewolfRole.TavernKeeper]: { targetPlayerId: "p1", confirmed: true },
        [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p2" },
      },
      assignments,
      [],
    );
    const hangover = events.find(
      (e) => e.type === "hangover" && e.targetPlayerId === "p1",
    );
    expect(hangover).toBeDefined();
  });

  it("emits no hangover when TK has no target", () => {
    const events = resolveNightActions(
      {
        [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
      },
      assignments,
      [],
    );
    const hangover = events.find((e) => e.type === "hangover");
    expect(hangover).toBeUndefined();
  });

  it("emits no hangover when TK skipped", () => {
    const events = resolveNightActions(
      {
        [WerewolfRole.TavernKeeper]: { skipped: true },
        [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
      },
      assignments,
      [],
    );
    const hangover = events.find((e) => e.type === "hangover");
    expect(hangover).toBeUndefined();
  });

  it("TK can target themselves — emits hangover for TK player", () => {
    const events = resolveNightActions(
      {
        [WerewolfRole.TavernKeeper]: { targetPlayerId: "tk1", confirmed: true },
      },
      assignments,
      [],
    );
    const hangover = events.find(
      (e) => e.type === "hangover" && e.targetPlayerId === "tk1",
    );
    expect(hangover).toBeDefined();
  });

  it("suppresses hangover when the TK's target was killed that night", () => {
    // Werewolf attacks bg1; TK also targets bg1 → bg1 dies, no hangover shown.
    const events = resolveNightActions(
      {
        [WerewolfRole.TavernKeeper]: { targetPlayerId: "bg1", confirmed: true },
        [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "bg1" },
      },
      assignments,
      [],
    );
    const killed = events.find(
      (e) => e.type === "killed" && e.targetPlayerId === "bg1",
    );
    expect(killed?.type === "killed" && killed.died).toBe(true);
    const hangover = events.find(
      (e) => e.type === "hangover" && e.targetPlayerId === "bg1",
    );
    expect(hangover).toBeUndefined();
  });

  it("does not protect the target from attacks — wolf kill still applies", () => {
    // TK targets p1; wolves also attack p1 → p1 dies (TK undo only removes p1's OWN action).
    const events = resolveNightActions(
      {
        [WerewolfRole.TavernKeeper]: { targetPlayerId: "p1", confirmed: true },
        [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
      },
      assignments,
      [],
    );
    const killed = events.find(
      (e) => e.type === "killed" && e.targetPlayerId === "p1",
    );
    expect(killed?.type === "killed" && killed.died).toBe(true);
    // No hangover since p1 was killed
    const hangover = events.find(
      (e) => e.type === "hangover" && e.targetPlayerId === "p1",
    );
    expect(hangover).toBeUndefined();
  });

  it("emits hangover but does not cancel the group attack when TK targets a wakesWith role (Wolf Cub)", () => {
    // Wolf Cub wakes with Werewolf — TK targets Wolf Cub.
    // The Werewolf group phase must NOT be removed (would cancel all wolves' attack).
    // A hangover event should still be emitted for the Wolf Cub.
    const events = resolveNightActions(
      {
        [WerewolfRole.TavernKeeper]: { targetPlayerId: "wc1", confirmed: true },
        [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" },
      },
      assignments,
      [],
    );
    const hangover = events.find(
      (e) => e.type === "hangover" && e.targetPlayerId === "wc1",
    );
    expect(hangover).toBeDefined();
    // Wolves' attack on p1 must still resolve
    const killed = events.find(
      (e) => e.type === "killed" && e.targetPlayerId === "p1",
    );
    expect(killed?.type === "killed" && killed.died).toBe(true);
  });
});
