import { Team, type RoleDefinition } from "@/lib/models";

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: "good",
    name: "Good Role",
    team: Team.Good,
    canSeeTeammates: false,
    knownToTeammates: false,
  },
  {
    id: "bad",
    name: "Bad Role",
    team: Team.Bad,
    canSeeTeammates: true,
    knownToTeammates: true,
  },
  {
    id: "special-bad",
    name: "Special Bad Role",
    team: Team.Bad,
    canSeeTeammates: false,
    knownToTeammates: true,
  },
];
