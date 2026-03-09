import { Team } from "@/lib/models";
import type { GameModeConfig, RoleDefinition, RoleSlot } from "@/lib/models";

export interface WerewolfRoleDefinition extends RoleDefinition<
  WerewolfRole,
  Team
> {
  wakesAtNight: boolean | "first-night-only";
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
  const villagers = n - werewolves;
  return [
    { roleId: WerewolfRole.Werewolf, count: werewolves },
    { roleId: WerewolfRole.Villager, count: villagers },
  ];
}

export const WEREWOLF_ROLES: Record<WerewolfRole, WerewolfRoleDefinition> = {
  [WerewolfRole.Villager]: {
    id: WerewolfRole.Villager,
    name: "Villager",
    team: Team.Good,
    wakesAtNight: false,
  },
  [WerewolfRole.Werewolf]: {
    id: WerewolfRole.Werewolf,
    name: "Werewolf",
    team: Team.Bad,
    canSeeTeam: [Team.Bad],
    wakesAtNight: true,
  },
  [WerewolfRole.Seer]: {
    id: WerewolfRole.Seer,
    name: "Seer",
    team: Team.Good,
    wakesAtNight: true,
  },
  [WerewolfRole.Witch]: {
    id: WerewolfRole.Witch,
    name: "Witch",
    team: Team.Good,
    wakesAtNight: true,
  },
  [WerewolfRole.Spellcaster]: {
    id: WerewolfRole.Spellcaster,
    name: "Spellcaster",
    team: Team.Good,
    wakesAtNight: true,
  },
  [WerewolfRole.Mason]: {
    id: WerewolfRole.Mason,
    name: "Mason",
    team: Team.Good,
    wakesAtNight: "first-night-only",
  },
  [WerewolfRole.Chupacabra]: {
    id: WerewolfRole.Chupacabra,
    name: "Chupacabra",
    team: Team.Neutral,
    wakesAtNight: true,
  },
  [WerewolfRole.VillageIdiot]: {
    id: WerewolfRole.VillageIdiot,
    name: "Village Idiot",
    team: Team.Good,
    wakesAtNight: false,
  },
  [WerewolfRole.Bodyguard]: {
    id: WerewolfRole.Bodyguard,
    name: "Bodyguard",
    team: Team.Good,
    wakesAtNight: true,
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
} satisfies GameModeConfig;
