import { GameMode, Team } from "@/lib/models";
import type { RoleDefinition } from "@/lib/models";

export const GAME_MODE_ROLES: Record<GameMode, RoleDefinition[]> = {
  [GameMode.SecretVillain]: [
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
  ],
  [GameMode.Avalon]: [
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
  ],
  [GameMode.Werewolf]: [
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
  ],
};

export const GAME_MODE_NAMES: Record<GameMode, string> = {
  [GameMode.SecretVillain]: "Secret Villain",
  [GameMode.Avalon]: "Avalon",
  [GameMode.Werewolf]: "Werewolf",
};
