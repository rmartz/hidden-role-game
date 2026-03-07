import { Team } from "@/lib/models";
import type { RoleDefinition } from "@/lib/models";

export const AVALON_ROLES: RoleDefinition[] = [
  {
    id: "avalon-good",
    name: "Good Role",
    team: Team.Good,
    canSeeTeam: [],
  },
  {
    id: "avalon-special-good",
    name: "Special Good Role",
    team: Team.Good,
    canSeeTeam: [Team.Bad],
  },
  {
    id: "avalon-bad",
    name: "Bad Role",
    team: Team.Bad,
    canSeeTeam: [],
  },
];
