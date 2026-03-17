import { Team } from "@/lib/types";
import type { RoleDefinition, RoleSlot } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "./types";

export enum WerewolfRole {
  Villager = "werewolf-villager",
  Werewolf = "werewolf-werewolf",
  WolfCub = "werewolf-wolf-cub",
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
  /** When true, this role is the primary role for a group voting phase. */
  teamTargeting?: boolean;
  /** When true, the role cannot target the same player on consecutive nights. */
  preventRepeatTarget?: boolean;
  /**
   * When set, this role secretly joins the referenced role's night phase
   * instead of having its own. Other players only see the primary role's name.
   */
  wakesWith?: WerewolfRole;
  /** When true, this role must always cast a "guilty" vote during elimination trials. */
  alwaysVotesGuilty?: boolean;
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
    summary: "An ordinary member of the village",
    description:
      "The Villager has no special abilities and no night action. They must rely on their wits and discussion during the day to identify and eliminate the Werewolves.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
  },
  [WerewolfRole.Werewolf]: {
    id: WerewolfRole.Werewolf,
    name: "Werewolf",
    summary: "Eliminates a villager each night",
    description:
      "Each night the Werewolves secretly vote together to eliminate one player. Werewolves can see all other players on the Bad team, including Wolf Cubs.",
    team: Team.Bad,
    canSeeTeam: [Team.Bad],
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Attack,
    teamTargeting: true,
  },
  [WerewolfRole.WolfCub]: {
    id: WerewolfRole.WolfCub,
    name: "Wolf Cub",
    summary: "A young werewolf who joins the nightly hunt",
    description:
      "The Wolf Cub participates in the Werewolf group attack each night. If the Wolf Cub is ever eliminated, the Werewolves gain two attack phases the following night.",
    team: Team.Bad,
    canSeeTeam: [Team.Bad],
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Attack,
    wakesWith: WerewolfRole.Werewolf,
  },
  [WerewolfRole.Seer]: {
    id: WerewolfRole.Seer,
    name: "Seer",
    summary: "Discovers if a player is evil each night",
    description:
      "Each night the Seer targets one player and the Narrator privately reveals whether that player is on Team Bad. Players who are evil but not allied with the Werewolves are not revealed to the Seer.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Investigate,
  },
  [WerewolfRole.Witch]: {
    id: WerewolfRole.Witch,
    name: "Witch",
    summary: "Has a one-time power to protect or strike",
    description:
      "After all other night roles have acted, the Witch may use her special ability: either protect the player who was attacked that night, or attack any other player. This ability can only be used once per game.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Special,
  },
  [WerewolfRole.Spellcaster]: {
    id: WerewolfRole.Spellcaster,
    name: "Spellcaster",
    summary: "Silences a player each night",
    description:
      "Each night the Spellcaster targets one player who is silenced the following day and cannot speak. The Spellcaster cannot target the same player on consecutive nights.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Special,
    preventRepeatTarget: true,
  },
  [WerewolfRole.Mason]: {
    id: WerewolfRole.Mason,
    name: "Mason",
    summary: "Knows the identities of all other Masons",
    description:
      "On the first night, all Masons wake together and identify each other. Masons have no night action after the first night, but they know with certainty that their fellow Masons are on the Good team.",
    team: Team.Good,
    canSeeRole: [WerewolfRole.Mason],
    wakesAtNight: WakesAtNight.FirstNightOnly,
    targetCategory: TargetCategory.None,
  },
  [WerewolfRole.Chupacabra]: {
    id: WerewolfRole.Chupacabra,
    name: "Chupacabra",
    summary: "A neutral predator that hunts only the wicked",
    description:
      "Each night the Chupacabra targets one player. The attack only succeeds if the target is on Team Bad — or if all Team Bad players have already been eliminated. The Chupacabra is on Team Neutral and has its own win condition.",
    team: Team.Neutral,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Attack,
  },
  [WerewolfRole.VillageIdiot]: {
    id: WerewolfRole.VillageIdiot,
    name: "Village Idiot",
    summary: "Always votes to convict in daytime trials",
    description:
      "The Village Idiot is a Good-team member who is compelled to always vote Guilty in daytime elimination trials. If the Village Idiot is put on trial and found innocent, the other players will know that a Village Idiot is in the game.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
    alwaysVotesGuilty: true,
  },
  [WerewolfRole.Bodyguard]: {
    id: WerewolfRole.Bodyguard,
    name: "Bodyguard",
    summary: "Protects a player from elimination each night",
    description:
      "Each night the Bodyguard chooses one player to protect. If that player is attacked, they survive. The Bodyguard cannot protect the same player on consecutive nights.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Protect,
    preventRepeatTarget: true,
  },
};

/** Returns true if the given string is a known WerewolfRole. */
export function isWerewolfRole(id: string): id is WerewolfRole {
  return id in WEREWOLF_ROLES;
}
