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
  Doctor = "werewolf-doctor",
  Priest = "werewolf-priest",
  ToughGuy = "werewolf-tough-guy",
  Minion = "werewolf-minion",
}

export interface WerewolfRoleDefinition extends RoleDefinition<
  WerewolfRole,
  Team
> {
  /** Override to allow werewolf-specific awareness criteria. */
  awareOf?: { teams?: Team[]; roles?: WerewolfRole[]; werewolves?: boolean };
  wakesAtNight: WakesAtNight;
  targetCategory: TargetCategory;
  /** When true, this role is the primary role for a group voting phase. */
  teamTargeting?: boolean;
  /** When true, the role cannot target the same player on consecutive nights. */
  preventRepeatTarget?: boolean;
  /** When true, this role cannot target themselves at night. */
  preventSelfTarget?: boolean;
  /**
   * When set, this role secretly joins the referenced role's night phase
   * instead of having its own. Other players only see the primary role's name.
   */
  wakesWith?: WerewolfRole;
  /** When true, this role must always cast a "guilty" vote during elimination trials. */
  alwaysVotesGuilty?: boolean;
  /** True for roles that register as "werewolf" for Seer investigation and Minion awareness. */
  isWerewolf?: boolean;
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
      "Each night the Werewolves wake together to choose their victim. They know which other players share their night phase, but not each other's specific roles.",
    team: Team.Bad,
    isWerewolf: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Attack,
    teamTargeting: true,
  },
  [WerewolfRole.WolfCub]: {
    id: WerewolfRole.WolfCub,
    name: "Wolf Cub",
    summary: "A young werewolf who joins the nightly hunt",
    description:
      "The Wolf Cub wakes with the Werewolves and participates in their nightly attack. If the Wolf Cub is ever eliminated, the Werewolves gain two attack phases the following night.",
    team: Team.Bad,
    isWerewolf: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Attack,
    wakesWith: WerewolfRole.Werewolf,
  },
  [WerewolfRole.Seer]: {
    id: WerewolfRole.Seer,
    name: "Seer",
    summary: "Discovers if a player is evil each night",
    description:
      "Each night the Seer targets one player and the Narrator privately reveals whether that player is a Werewolf. Only Werewolves and Wolf Cubs are detected — other evil roles such as the Minion are not.",
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
      "On the first night, the Masons learn who the other Masons are. Masons have no night action after the first night, but they can trust each other completely.",
    team: Team.Good,
    awareOf: { roles: [WerewolfRole.Mason] },
    wakesAtNight: WakesAtNight.FirstNightOnly,
    targetCategory: TargetCategory.None,
  },
  [WerewolfRole.Chupacabra]: {
    id: WerewolfRole.Chupacabra,
    name: "Chupacabra",
    summary: "A neutral predator that hunts Werewolves",
    description:
      "Each night the Chupacabra targets one player. The attack only succeeds if the target is a Werewolf — once all Werewolves have been eliminated, the Chupacabra can attack anyone. The Chupacabra is neutral and has its own win condition.",
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
  [WerewolfRole.Doctor]: {
    id: WerewolfRole.Doctor,
    name: "Doctor",
    summary: "Protects a player from elimination each night",
    description:
      "Each night the Doctor chooses one player to protect from werewolf attacks. Unlike the Bodyguard, the Doctor can protect the same player on consecutive nights but cannot protect themselves.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Protect,
    preventSelfTarget: true,
  },
  [WerewolfRole.Priest]: {
    id: WerewolfRole.Priest,
    name: "Priest",
    summary: "Places a permanent ward on a player",
    description:
      "The Priest selects a player to place a ward on. The ward persists until the protected player is attacked, at which point the ward is consumed and the Priest selects a new target on the following night.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Protect,
  },
  [WerewolfRole.ToughGuy]: {
    id: WerewolfRole.ToughGuy,
    name: "Tough Guy",
    summary: "Survives the first werewolf attack",
    description:
      "The Tough Guy is a resilient villager who can survive one werewolf attack. After surviving the first attack, the Tough Guy becomes vulnerable and will die normally if attacked again.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
  },
  [WerewolfRole.Minion]: {
    id: WerewolfRole.Minion,
    name: "Minion",
    summary: "A secret servant of the werewolves",
    description:
      "The Minion knows who the Werewolves are, but the Werewolves do not know the Minion's identity. The Minion wins with the Werewolves. The Seer's investigation reveals the Minion is not a Werewolf.",
    team: Team.Bad,
    awareOf: { werewolves: true },
    wakesAtNight: WakesAtNight.FirstNightOnly,
    targetCategory: TargetCategory.None,
  },
};

/** Returns true if the given string is a known WerewolfRole. */
export function isWerewolfRole(id: string): id is WerewolfRole {
  return id in WEREWOLF_ROLES;
}
