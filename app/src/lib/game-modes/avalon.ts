import type { RoleDefinition, RoleSlot } from "@/lib/models";

export enum AvalonRole {
  Good = "avalon-good",
  SpecialGood = "avalon-special-good",
  Bad = "avalon-bad",
}

export enum AvalonTeam {
  Good = "Good",
  Bad = "Bad",
}

export const AVALON_ROLES: Record<
  AvalonRole,
  RoleDefinition<AvalonRole, AvalonTeam>
> = {
  [AvalonRole.Good]: {
    id: AvalonRole.Good,
    name: "Good Role",
    team: AvalonTeam.Good,
  },
  [AvalonRole.SpecialGood]: {
    id: AvalonRole.SpecialGood,
    name: "Special Good Role",
    team: AvalonTeam.Good,
    canSeeTeam: [AvalonTeam.Bad],
  },
  [AvalonRole.Bad]: {
    id: AvalonRole.Bad,
    name: "Bad Role",
    team: AvalonTeam.Bad,
  },
};

export const MIN_PLAYERS = 5;

export function defaultRoleCount(numPlayers: number): RoleSlot[] {
  const bad = Math.floor((numPlayers - 1) / 2);
  const specialGood = 1;
  const good = numPlayers - bad - specialGood;
  return [
    { roleId: AvalonRole.Bad, count: bad },
    { roleId: AvalonRole.SpecialGood, count: specialGood },
    { roleId: AvalonRole.Good, count: good },
  ];
}
