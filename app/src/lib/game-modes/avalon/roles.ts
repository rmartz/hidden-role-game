import { Team } from "@/lib/models";
import type { RoleSlot } from "@/lib/models";

export enum AvalonRole {
  Good = "avalon-good",
  SpecialGood = "avalon-special-good",
  Bad = "avalon-bad",
}

export const MIN_PLAYERS = 5;

export function defaultRoleCount(numPlayers: number): RoleSlot[] {
  const n = Math.max(numPlayers, MIN_PLAYERS);
  const bad = Math.floor((n - 1) / 2);
  const specialGood = 1;
  const good = n - bad - specialGood;
  return [
    { roleId: AvalonRole.Bad, min: bad, max: bad },
    { roleId: AvalonRole.SpecialGood, min: specialGood, max: specialGood },
    { roleId: AvalonRole.Good, min: good, max: good },
  ];
}

export const AVALON_ROLES = {
  [AvalonRole.Good]: {
    id: AvalonRole.Good,
    name: "Good Role",
    team: Team.Good,
  },
  [AvalonRole.SpecialGood]: {
    id: AvalonRole.SpecialGood,
    name: "Special Good Role",
    team: Team.Good,
    canSeeTeam: [Team.Bad],
  },
  [AvalonRole.Bad]: {
    id: AvalonRole.Bad,
    name: "Bad Role",
    team: Team.Bad,
  },
};
