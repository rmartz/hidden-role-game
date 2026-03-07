import { Team } from "@/lib/models";
import type { RoleDefinition } from "@/lib/models";

export const SECRET_VILLAIN_ROLES: RoleDefinition[] = [
  {
    id: "good",
    name: "Good Role",
    team: Team.Good,
    canSeeTeam: [],
  },
  {
    id: "bad",
    name: "Bad Role",
    team: Team.Bad,
    canSeeTeam: [Team.Bad],
  },
  {
    id: "special-bad",
    name: "Special Bad Role",
    team: Team.Bad,
    canSeeTeam: [],
  },
];
