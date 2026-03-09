import { Team } from "@/lib/models";
import type { GameModeConfig, RoleSlot } from "@/lib/models";

export enum WerewolfRole {
  Good = "werewolf-good",
  Bad = "werewolf-bad",
}

function defaultRoleCount(numPlayers: number): RoleSlot[] {
  const bad = Math.floor(numPlayers / 3);
  const good = numPlayers - bad;
  return [
    { roleId: WerewolfRole.Bad, count: bad },
    { roleId: WerewolfRole.Good, count: good },
  ];
}

export const WEREWOLF_CONFIG = {
  name: "Werewolf",
  minPlayers: 5,
  ownerTitle: "Narrator",
  teamLabels: {
    [Team.Good]: "Villagers",
    [Team.Bad]: "Werewolves",
  },
  roles: {
    [WerewolfRole.Good]: {
      id: WerewolfRole.Good,
      name: "Good Role",
      team: Team.Good,
    },
    [WerewolfRole.Bad]: {
      id: WerewolfRole.Bad,
      name: "Bad Role",
      team: Team.Bad,
    },
  },
  defaultRoleCount,
} satisfies GameModeConfig;
