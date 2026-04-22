import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../roles";
import { GROUP_PHASE_KEY_SEPARATOR } from "./phase-keys";
import { buildNightPhaseOrder } from "./night-phase";

const assignments = [
  { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
  { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
  { playerId: "p3", roleDefinitionId: WerewolfRole.Mason },
  { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
];

describe("buildNightPhaseOrder", () => {
  it("includes EveryNight and FirstNightOnly roles on turn 1", () => {
    const order = buildNightPhaseOrder(1, assignments);
    expect(order).toContain(WerewolfRole.Werewolf);
    expect(order).toContain(WerewolfRole.Seer);
    expect(order).toContain(WerewolfRole.Mason);
  });

  it("excludes FirstNightOnly roles on turn 2+", () => {
    const order = buildNightPhaseOrder(2, assignments);
    expect(order).toContain(WerewolfRole.Werewolf);
    expect(order).toContain(WerewolfRole.Seer);
    expect(order).not.toContain(WerewolfRole.Mason);
  });

  it("excludes roles not present in roleAssignments", () => {
    const order = buildNightPhaseOrder(1, assignments);
    expect(order).not.toContain(WerewolfRole.Witch);
    expect(order).not.toContain(WerewolfRole.Spellcaster);
  });

  it("excludes Never-waking roles even if assigned", () => {
    const order = buildNightPhaseOrder(1, assignments);
    expect(order).not.toContain(WerewolfRole.Villager);
  });

  it("skips group phase when all werewolf players are dead", () => {
    const order = buildNightPhaseOrder(2, assignments, ["p1"]);
    expect(order).not.toContain(WerewolfRole.Werewolf);
    expect(order).toContain(WerewolfRole.Seer);
  });

  it("skips solo phase when the role player is dead", () => {
    const order = buildNightPhaseOrder(2, assignments, ["p2"]);
    expect(order).toContain(WerewolfRole.Werewolf);
    expect(order).not.toContain(WerewolfRole.Seer);
  });

  it("keeps group phase when at least one werewolf is alive", () => {
    const multiWolf = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, multiWolf, ["w1"]);
    expect(order).toContain(WerewolfRole.Werewolf);
  });

  it("skips Wolf Cub as its own phase key (it joins Werewolf phase)", () => {
    const withCub = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "c1", roleDefinitionId: WerewolfRole.WolfCub },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, withCub);
    expect(order).toContain(WerewolfRole.Werewolf);
    expect(order).not.toContain(WerewolfRole.WolfCub);
  });

  it("keeps Werewolf phase when only Wolf Cub is alive (no Werewolves)", () => {
    const cubOnly = [
      { playerId: "c1", roleDefinitionId: WerewolfRole.WolfCub },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, cubOnly);
    // Wolf Cub wakes with Werewolves, so the Werewolf phase is still triggered
    expect(order).toContain(WerewolfRole.Werewolf);
    expect(order).not.toContain(WerewolfRole.WolfCub);
  });

  it("includes extraGroupPhaseKeys before the end of the order", () => {
    const order = buildNightPhaseOrder(
      2,
      assignments,
      [],
      [WerewolfRole.Werewolf],
    );
    const firstIdx = order.indexOf(WerewolfRole.Werewolf);
    const lastIdx = order.lastIndexOf(WerewolfRole.Werewolf);
    expect(firstIdx).not.toBe(lastIdx); // appears twice
  });

  it("skips extraGroupPhaseKey when all group participants are dead", () => {
    // Simulates the Wolf Cub bonus phase when all werewolves are dead.
    const BONUS_PHASE_KEY = `${WerewolfRole.Werewolf}${GROUP_PHASE_KEY_SEPARATOR}2`;
    const order = buildNightPhaseOrder(
      2,
      assignments,
      ["p1"], // p1 is the only Werewolf — now dead
      [BONUS_PHASE_KEY],
    );
    expect(order).not.toContain(WerewolfRole.Werewolf); // base phase also skipped
    expect(order).not.toContain(BONUS_PHASE_KEY); // bonus phase skipped too
    expect(order).toContain(WerewolfRole.Seer);
  });

  it("keeps extraGroupPhaseKey when at least one group participant is alive", () => {
    const BONUS_PHASE_KEY = `${WerewolfRole.Werewolf}${GROUP_PHASE_KEY_SEPARATOR}2`;
    const multiWolf = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "w2", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, multiWolf, ["w1"], [BONUS_PHASE_KEY]);
    expect(order).toContain(BONUS_PHASE_KEY); // w2 is still alive
  });

  it("excludes AfterFirstNight roles on turn 1", () => {
    const withVigilante = [
      ...assignments,
      { playerId: "p5", roleDefinitionId: WerewolfRole.Vigilante },
    ];
    const order = buildNightPhaseOrder(1, withVigilante);
    expect(order).not.toContain(WerewolfRole.Vigilante);
  });

  it("includes AfterFirstNight roles on turn 2+", () => {
    const withVigilante = [
      ...assignments,
      { playerId: "p5", roleDefinitionId: WerewolfRole.Vigilante },
    ];
    const order = buildNightPhaseOrder(2, withVigilante);
    expect(order).toContain(WerewolfRole.Vigilante);
  });

  it("places Werewolf (Bad team) before Chupacabra (Neutral team) before Seer (Good team)", () => {
    const mixedTeams = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "n1", roleDefinitionId: WerewolfRole.Chupacabra },
      { playerId: "g1", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, mixedTeams);
    const werewolfIdx = order.indexOf(WerewolfRole.Werewolf);
    const chupacabraIdx = order.indexOf(WerewolfRole.Chupacabra);
    const seerIdx = order.indexOf(WerewolfRole.Seer);
    expect(werewolfIdx).toBeLessThan(chupacabraIdx);
    expect(chupacabraIdx).toBeLessThan(seerIdx);
  });

  it("places Wizard (Bad/EvilSupport) after Werewolf (Bad/EvilKilling)", () => {
    const badTeam = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "wz1", roleDefinitionId: WerewolfRole.Wizard },
    ];
    const order = buildNightPhaseOrder(2, badTeam);
    const werewolfIdx = order.indexOf(WerewolfRole.Werewolf);
    const wizardIdx = order.indexOf(WerewolfRole.Wizard);
    expect(werewolfIdx).toBeLessThan(wizardIdx);
  });

  it("places Good/Attack role (Mortician) before Good/Investigate role (Seer)", () => {
    const goodAttackAndInvestigate = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "m1", roleDefinitionId: WerewolfRole.Mortician },
      { playerId: "s1", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, goodAttackAndInvestigate);
    const morticianIdx = order.indexOf(WerewolfRole.Mortician);
    const seerIdx = order.indexOf(WerewolfRole.Seer);
    expect(morticianIdx).toBeLessThan(seerIdx);
  });

  it("places Good/Investigate role (Seer) before Good/Protect role (Bodyguard)", () => {
    const goodInvestigateAndProtect = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "s1", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "b1", roleDefinitionId: WerewolfRole.Bodyguard },
    ];
    const order = buildNightPhaseOrder(2, goodInvestigateAndProtect);
    const seerIdx = order.indexOf(WerewolfRole.Seer);
    const bodyguardIdx = order.indexOf(WerewolfRole.Bodyguard);
    expect(seerIdx).toBeLessThan(bodyguardIdx);
  });

  it("places Wolf Cub bonus phase immediately after the first Werewolf phase", () => {
    const BONUS_PHASE_KEY = `${WerewolfRole.Werewolf}${GROUP_PHASE_KEY_SEPARATOR}2`;
    const withSeer = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "s1", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, withSeer, [], [BONUS_PHASE_KEY]);
    const werewolfIdx = order.indexOf(WerewolfRole.Werewolf);
    const bonusIdx = order.indexOf(BONUS_PHASE_KEY);
    expect(bonusIdx).toBe(werewolfIdx + 1);
  });

  it("places Werewolf first when many roles are present", () => {
    const manyRoles = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "c1", roleDefinitionId: WerewolfRole.Chupacabra },
      { playerId: "s1", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "b1", roleDefinitionId: WerewolfRole.Bodyguard },
      { playerId: "wz1", roleDefinitionId: WerewolfRole.Wizard },
    ];
    const order = buildNightPhaseOrder(2, manyRoles);
    expect(order[0]).toBe(WerewolfRole.Werewolf);
  });

  it("places FirstNightOnly role (Minion/EvilSupport) after Werewolf and before Seer on turn 1", () => {
    // Minion is FirstNightOnly and EvilSupport — it should sort between
    // EvilKilling (Werewolf) and VillagerInvestigation (Seer) on night 1.
    const withMinion = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "m1", roleDefinitionId: WerewolfRole.Minion },
      { playerId: "s1", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(1, withMinion);
    const werewolfIdx = order.indexOf(WerewolfRole.Werewolf);
    const minionIdx = order.indexOf(WerewolfRole.Minion);
    const seerIdx = order.indexOf(WerewolfRole.Seer);
    expect(werewolfIdx).toBeLessThan(minionIdx);
    expect(minionIdx).toBeLessThan(seerIdx);
  });

  it("places AfterFirstNight role (Vigilante/VillagerKilling) before Seer (VillagerInvestigation) on turn 2+", () => {
    // Vigilante is AfterFirstNight and VillagerKilling — it should sort before
    // VillagerInvestigation (Seer) once active.
    const withVigilante = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "v1", roleDefinitionId: WerewolfRole.Vigilante },
      { playerId: "s1", roleDefinitionId: WerewolfRole.Seer },
    ];
    const order = buildNightPhaseOrder(2, withVigilante);
    const vigilanteIdx = order.indexOf(WerewolfRole.Vigilante);
    const seerIdx = order.indexOf(WerewolfRole.Seer);
    expect(vigilanteIdx).toBeLessThan(seerIdx);
  });

  it("places Insomniac absolutely last — after Seer, Witch, and Altruist", () => {
    const withInsomniac = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "s1", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "wt1", roleDefinitionId: WerewolfRole.Witch },
      { playerId: "a1", roleDefinitionId: WerewolfRole.Altruist },
      { playerId: "i1", roleDefinitionId: WerewolfRole.Insomniac },
    ];
    const order = buildNightPhaseOrder(2, withInsomniac);
    const seerIdx = order.indexOf(WerewolfRole.Seer);
    const witchIdx = order.indexOf(WerewolfRole.Witch);
    const altruistIdx = order.indexOf(WerewolfRole.Altruist);
    const insomniacIdx = order.indexOf(WerewolfRole.Insomniac);
    expect(insomniacIdx).toBeGreaterThan(seerIdx);
    expect(insomniacIdx).toBeGreaterThan(witchIdx);
    expect(insomniacIdx).toBeGreaterThan(altruistIdx);
    expect(insomniacIdx).toBe(order.length - 1);
  });

  it("omits Insomniac when Insomniac player is dead", () => {
    const withInsomniac = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "s1", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "i1", roleDefinitionId: WerewolfRole.Insomniac },
    ];
    const order = buildNightPhaseOrder(2, withInsomniac, ["i1"]);
    expect(order).not.toContain(WerewolfRole.Insomniac);
  });

  it("includes The Count on turn 1 and omits it on turn 2", () => {
    const withCount = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "c1", roleDefinitionId: WerewolfRole.Count },
    ];
    const turn1Order = buildNightPhaseOrder(1, withCount);
    const turn2Order = buildNightPhaseOrder(2, withCount);
    expect(turn1Order).toContain(WerewolfRole.Count);
    expect(turn2Order).not.toContain(WerewolfRole.Count);
  });

  it("includes The Thing on every night", () => {
    const withThing = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "t1", roleDefinitionId: WerewolfRole.TheThing },
    ];
    expect(buildNightPhaseOrder(1, withThing)).toContain(WerewolfRole.TheThing);
    expect(buildNightPhaseOrder(2, withThing)).toContain(WerewolfRole.TheThing);
  });
});
