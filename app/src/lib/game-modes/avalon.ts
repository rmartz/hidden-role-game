import { Team } from "@/lib/models";
import type { GameModeConfig, RoleSlot } from "@/lib/models";

export enum AvalonRole {
  Good = "avalon-good",
  SpecialGood = "avalon-special-good",
  Bad = "avalon-bad",
}

function defaultRoleCount(numPlayers: number): RoleSlot[] {
  const bad = Math.floor((numPlayers - 1) / 2);
  const specialGood = 1;
  const good = numPlayers - bad - specialGood;
  return [
    { roleId: AvalonRole.Bad, count: bad },
    { roleId: AvalonRole.SpecialGood, count: specialGood },
    { roleId: AvalonRole.Good, count: good },
  ];
}

export const AVALON_CONFIG = {
  name: "Avalon",
  minPlayers: 5,
  ownerTitle: null,
  teamLabels: {
    [Team.Good]: "Good",
    [Team.Bad]: "Evil",
  },
  roles: {
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
  },
  defaultRoleCount,
} satisfies GameModeConfig;
