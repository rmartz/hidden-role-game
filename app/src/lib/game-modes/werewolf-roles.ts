import { Team } from "@/lib/models";
import type { RoleDefinition } from "@/lib/models";

export const WEREWOLF_ROLES: RoleDefinition[] = [
  {
    id: "werewolf-good",
    name: "Good Role",
    team: Team.Good,
    canSeeTeam: [],
  },
  {
    id: "werewolf-bad",
    name: "Bad Role",
    team: Team.Bad,
    canSeeTeam: [],
  },
];
