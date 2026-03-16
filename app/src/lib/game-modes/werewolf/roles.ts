import { Team } from "@/lib/types";
import type { RoleDefinition, RoleSlot } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "./types";

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

export interface WerewolfRoleDefinition extends RoleDefinition<
  WerewolfRole,
  Team
> {
  wakesAtNight: WakesAtNight;
  targetCategory: TargetCategory;
  /** When true, all players with this role on the same team wake and target together. */
  teamTargeting?: boolean;
  /** When true, the role cannot target the same player on consecutive nights. */
  preventRepeatTarget?: boolean;
}

export const MIN_PLAYERS = 5;

export function defaultRoleCount(numPlayers: number): RoleSlot[] {
  // Subtract 1 for the Narrator, who is a player but receives no role.
  const n = Math.max(numPlayers, MIN_PLAYERS) - 1;
  const werewolves = Math.floor(n / 3);
  const villagers = n - werewolves - 1;
  return [
    { roleId: WerewolfRole.Werewolf, min: werewolves, max: werewolves },
    { roleId: WerewolfRole.Villager, min: villagers, max: villagers },
    { roleId: WerewolfRole.Seer, min: 1, max: 1 },
  ];
}

export const WEREWOLF_ROLES: Record<WerewolfRole, WerewolfRoleDefinition> = {
  [WerewolfRole.Villager]: {
    id: WerewolfRole.Villager,
    name: "Villager",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
  },
  [WerewolfRole.Werewolf]: {
    id: WerewolfRole.Werewolf,
    name: "Werewolf",
    team: Team.Bad,
    canSeeTeam: [Team.Bad],
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Attack,
    teamTargeting: true,
  },
  [WerewolfRole.Seer]: {
    id: WerewolfRole.Seer,
    name: "Seer",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Investigate,
  },
  [WerewolfRole.Witch]: {
    id: WerewolfRole.Witch,
    name: "Witch",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Special,
  },
  [WerewolfRole.Spellcaster]: {
    id: WerewolfRole.Spellcaster,
    name: "Spellcaster",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Special,
    preventRepeatTarget: true,
  },
  [WerewolfRole.Mason]: {
    id: WerewolfRole.Mason,
    name: "Mason",
    team: Team.Good,
    canSeeRole: [WerewolfRole.Mason],
    wakesAtNight: WakesAtNight.FirstNightOnly,
    targetCategory: TargetCategory.None,
  },
  [WerewolfRole.Chupacabra]: {
    id: WerewolfRole.Chupacabra,
    name: "Chupacabra",
    team: Team.Neutral,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Attack,
  },
  [WerewolfRole.VillageIdiot]: {
    id: WerewolfRole.VillageIdiot,
    name: "Village Idiot",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
  },
  [WerewolfRole.Bodyguard]: {
    id: WerewolfRole.Bodyguard,
    name: "Bodyguard",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Protect,
    preventRepeatTarget: true,
  },
};
