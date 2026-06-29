import type { RoleBucket } from "@/lib/types";

import { ClocktowerRole } from "./_types";

// ---------------------------------------------------------------------------
// Player count → role distribution
// ---------------------------------------------------------------------------

interface RoleDistribution {
  townsfolk: number;
  outsiders: number;
  minions: number;
  demons: number;
}

const ROLE_DISTRIBUTIONS: Record<number, RoleDistribution> = {
  5: { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 },
  6: { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 },
  7: { townsfolk: 5, outsiders: 0, minions: 1, demons: 1 },
  8: { townsfolk: 5, outsiders: 1, minions: 1, demons: 1 },
  9: { townsfolk: 5, outsiders: 2, minions: 1, demons: 1 },
  10: { townsfolk: 7, outsiders: 0, minions: 2, demons: 1 },
  11: { townsfolk: 7, outsiders: 1, minions: 2, demons: 1 },
  12: { townsfolk: 7, outsiders: 2, minions: 2, demons: 1 },
  13: { townsfolk: 9, outsiders: 0, minions: 3, demons: 1 },
  14: { townsfolk: 9, outsiders: 1, minions: 3, demons: 1 },
  15: { townsfolk: 9, outsiders: 2, minions: 3, demons: 1 },
};

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 15;

const FALLBACK_DISTRIBUTION: RoleDistribution = {
  townsfolk: 9,
  outsiders: 2,
  minions: 3,
  demons: 1,
};

/**
 * Returns default role buckets for Clocktower's Trouble Brewing script.
 * All players receive a role — there is no narrator slot.
 *
 * Note: The Baron modifies this — when the Baron is in play, 2 extra Outsiders
 * replace 2 Townsfolk slots. This adjustment is made during game initialization,
 * not in the default bucket configuration.
 */
export function defaultRoleCount(numPlayers: number): RoleBucket[] {
  const n = Math.min(Math.max(numPlayers, MIN_PLAYERS), MAX_PLAYERS);
  const dist = ROLE_DISTRIBUTIONS[n] ?? FALLBACK_DISTRIBUTION;

  return [
    {
      playerCount: dist.townsfolk,
      roles: [
        { roleId: ClocktowerRole.Washerwoman, max: 1 },
        { roleId: ClocktowerRole.Librarian, max: 1 },
        { roleId: ClocktowerRole.Investigator, max: 1 },
        { roleId: ClocktowerRole.Chef, max: 1 },
        { roleId: ClocktowerRole.Empath, max: 1 },
        { roleId: ClocktowerRole.FortuneTeller, max: 1 },
        { roleId: ClocktowerRole.Undertaker, max: 1 },
        { roleId: ClocktowerRole.Monk, max: 1 },
        { roleId: ClocktowerRole.Ravenkeeper, max: 1 },
        { roleId: ClocktowerRole.Virgin, max: 1 },
        { roleId: ClocktowerRole.Slayer, max: 1 },
        { roleId: ClocktowerRole.Soldier, max: 1 },
        { roleId: ClocktowerRole.Mayor, max: 1 },
      ],
      name: "Townsfolk",
    },
    {
      playerCount: dist.outsiders,
      roles: [
        { roleId: ClocktowerRole.Butler, max: 1 },
        { roleId: ClocktowerRole.Drunk, max: 1 },
        { roleId: ClocktowerRole.Recluse, max: 1 },
        { roleId: ClocktowerRole.Saint, max: 1 },
      ],
      name: "Outsiders",
    },
    {
      playerCount: dist.minions,
      roles: [
        { roleId: ClocktowerRole.Poisoner, max: 1 },
        { roleId: ClocktowerRole.Spy, max: 1 },
        { roleId: ClocktowerRole.ScarletWoman, max: 1 },
        { roleId: ClocktowerRole.Baron, max: 1 },
      ],
      name: "Minions",
    },
    {
      playerCount: dist.demons,
      roles: [{ roleId: ClocktowerRole.Imp, max: 1 }],
      name: "Demon",
    },
  ];
}
