import type { RoleDefinition } from "@/lib/models";

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
