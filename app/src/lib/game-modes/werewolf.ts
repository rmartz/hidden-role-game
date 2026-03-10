import { sum } from "lodash";
import { Team } from "@/lib/models";
import type { GameModeConfig, RoleDefinition, RoleSlot } from "@/lib/models";

export enum WakesAtNight {
  Never = "Never",
  FirstNightOnly = "FirstNightOnly",
  EveryNight = "EveryNight",
}

export interface WerewolfRoleDefinition extends RoleDefinition<
  WerewolfRole,
  Team
> {
  wakesAtNight: WakesAtNight;
}

export enum WerewolfRole {
  Villager = "werewolf-villager",
  Werewolf = "werewolf-werewolf",
  Seer = "werewolf-seer",
  Witch = "werewolf-witch",
  Spellcaster = "werewolf-spellcaster",
  Mason = "werewolf-mason",
  Chupacabra = "werewolf-chupacabra",
  VillageIdiot = "werewolf-village-idiot",
  Bodyguard = "werewolf-bodyguard",
}

const MIN_PLAYERS = 5;

function defaultRoleCount(numPlayers: number): RoleSlot[] {
  const n = Math.max(numPlayers, MIN_PLAYERS);
  const werewolves = Math.floor(n / 3);
  const villagers = n - werewolves - 1;
  return [
    { roleId: WerewolfRole.Werewolf, count: werewolves },
    { roleId: WerewolfRole.Villager, count: villagers },
    { roleId: WerewolfRole.Seer, count: 1 },
  ];
}

export const WEREWOLF_ROLES: Record<WerewolfRole, WerewolfRoleDefinition> = {
  [WerewolfRole.Villager]: {
    id: WerewolfRole.Villager,
    name: "Villager",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
  },
  [WerewolfRole.Werewolf]: {
    id: WerewolfRole.Werewolf,
    name: "Werewolf",
    team: Team.Bad,
    canSeeTeam: [Team.Bad],
    wakesAtNight: WakesAtNight.EveryNight,
  },
  [WerewolfRole.Seer]: {
    id: WerewolfRole.Seer,
    name: "Seer",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
  },
  [WerewolfRole.Witch]: {
    id: WerewolfRole.Witch,
    name: "Witch",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
  },
  [WerewolfRole.Spellcaster]: {
    id: WerewolfRole.Spellcaster,
    name: "Spellcaster",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
  },
  [WerewolfRole.Mason]: {
    id: WerewolfRole.Mason,
    name: "Mason",
    team: Team.Good,
    canSeeRole: [WerewolfRole.Mason],
    wakesAtNight: WakesAtNight.FirstNightOnly,
  },
  [WerewolfRole.Chupacabra]: {
    id: WerewolfRole.Chupacabra,
    name: "Chupacabra",
    team: Team.Neutral,
    wakesAtNight: WakesAtNight.EveryNight,
  },
  [WerewolfRole.VillageIdiot]: {
    id: WerewolfRole.VillageIdiot,
    name: "Village Idiot",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
  },
  [WerewolfRole.Bodyguard]: {
    id: WerewolfRole.Bodyguard,
    name: "Bodyguard",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
  },
};

export const WEREWOLF_CONFIG = {
  name: "Werewolf",
  minPlayers: MIN_PLAYERS,
  ownerTitle: "Narrator",
  teamLabels: {
    [Team.Good]: "Villagers",
    [Team.Bad]: "Werewolves",
    [Team.Neutral]: "Neutral",
  },
  roles: WEREWOLF_ROLES,
  defaultRoleCount,
  // The Narrator is a player but doesn't receive a role.
  isValidRoleCount(numPlayers: number, roleCounts: Record<string, number>) {
    return sum(Object.values(roleCounts)) === numPlayers - 1;
  },
} satisfies GameModeConfig;
