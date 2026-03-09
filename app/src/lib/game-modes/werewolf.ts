import { Team } from "@/lib/models";
import type { GameModeConfig, RoleSlot } from "@/lib/models";

export enum WerewolfRole {
  Good = "werewolf-good",
  Bad = "werewolf-bad",
}

const MIN_PLAYERS = 5;

function defaultRoleCount(numPlayers: number): RoleSlot[] {
  const n = Math.max(numPlayers, MIN_PLAYERS);
  const bad = Math.floor(n / 3);
  const good = n - bad;
  return [
    { roleId: WerewolfRole.Bad, count: bad },
    { roleId: WerewolfRole.Good, count: good },
  ];
}

export const WEREWOLF_CONFIG = {
  name: "Werewolf",
  minPlayers: MIN_PLAYERS,
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
