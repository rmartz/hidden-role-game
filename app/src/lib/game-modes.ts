import { GameMode, Team } from "@/lib/models";
import type { RoleDefinition } from "@/lib/models";

export const GAME_MODE_ROLES: Record<GameMode, RoleDefinition[]> = {
  [GameMode.SecretVillain]: [
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
  ],
};

export const GAME_MODE_NAMES: Record<GameMode, string> = {
  [GameMode.SecretVillain]: "Secret Villain",
};
