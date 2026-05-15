import type { RoleDefinition } from "@/lib/types";
import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";

export enum WerewolfRoleCategory {
  EvilKilling = "evil-killing",
  EvilSupport = "evil-support",
  NeutralKilling = "neutral-killing",
  NeutralManipulation = "neutral-manipulation",
  VillagerInvestigation = "villager-investigation",
  VillagerProtection = "villager-protection",
  VillagerKilling = "villager-killing",
  VillagerSupport = "villager-support",
  VillagerHandicap = "villager-handicap",
}

export const WEREWOLF_ROLE_CATEGORY_ORDER: WerewolfRoleCategory[] = [
  WerewolfRoleCategory.EvilKilling,
  WerewolfRoleCategory.EvilSupport,
  WerewolfRoleCategory.NeutralKilling,
  WerewolfRoleCategory.NeutralManipulation,
  WerewolfRoleCategory.VillagerInvestigation,
  WerewolfRoleCategory.VillagerProtection,
  WerewolfRoleCategory.VillagerKilling,
  WerewolfRoleCategory.VillagerSupport,
  WerewolfRoleCategory.VillagerHandicap,
];

export const WEREWOLF_ROLE_CATEGORY_LABELS: Record<
  WerewolfRoleCategory,
  string
> = {
  [WerewolfRoleCategory.EvilKilling]: "Evil — Killing",
  [WerewolfRoleCategory.EvilSupport]: "Evil — Support",
  [WerewolfRoleCategory.NeutralKilling]: "Neutral — Killing",
  [WerewolfRoleCategory.NeutralManipulation]: "Neutral — Manipulation",
  [WerewolfRoleCategory.VillagerInvestigation]: "Villager — Investigation",
  [WerewolfRoleCategory.VillagerProtection]: "Villager — Protection",
  [WerewolfRoleCategory.VillagerKilling]: "Villager — Killing",
  [WerewolfRoleCategory.VillagerSupport]: "Villager — Support",
  [WerewolfRoleCategory.VillagerHandicap]: "Villager — Handicap",
};

export enum WerewolfRole {
  Altruist = "werewolf-altruist",
  Arsonist = "werewolf-arsonist",
  Bodyguard = "werewolf-bodyguard",
  Chupacabra = "werewolf-chupacabra",
  Count = "werewolf-count",
  Doctor = "werewolf-doctor",
  Dracula = "werewolf-dracula",
  ElusiveSeer = "werewolf-elusive-seer",
  Executioner = "werewolf-executioner",
  Exposer = "werewolf-exposer",
  Hunter = "werewolf-hunter",
  Illuminati = "werewolf-illuminati",
  Insomniac = "werewolf-insomniac",
  LoneWolf = "werewolf-lone-wolf",
  Mason = "werewolf-mason",
  Mayor = "werewolf-mayor",
  Mentalist = "werewolf-mentalist",
  Minion = "werewolf-minion",
  Mirrorcaster = "werewolf-mirrorcaster",
  Monarch = "werewolf-monarch",
  Mortician = "werewolf-mortician",
  Mummy = "werewolf-mummy",
  MysticSeer = "werewolf-mystic-seer",
  OldMan = "werewolf-old-man",
  OneEyedSeer = "werewolf-one-eyed-seer",
  Pacifist = "werewolf-pacifist",
  Priest = "werewolf-priest",
  Seer = "werewolf-seer",
  Sentinel = "werewolf-sentinel",
  Spellcaster = "werewolf-spellcaster",
  Spoiler = "werewolf-spoiler",
  Swapper = "werewolf-swapper",
  Tanner = "werewolf-tanner",
  TheThing = "werewolf-the-thing",
  ToughGuy = "werewolf-tough-guy",
  Veteran = "werewolf-veteran",
  Vigilante = "werewolf-vigilante",
  VillageIdiot = "werewolf-village-idiot",
  Villager = "werewolf-villager",
  Werewolf = "werewolf-werewolf",
  Witch = "werewolf-witch",
  Wizard = "werewolf-wizard",
  WolfCub = "werewolf-wolf-cub",
  Zombie = "werewolf-zombie",
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
  /** When true, this role must always cast an "innocent" vote during elimination trials. */
  alwaysVotesInnocent?: boolean;
  /** True for roles that register as "werewolf" for Seer investigation and Minion awareness. */
  isWerewolf?: boolean;
  /** Wizard only: investigation checks if the target is the Seer (not isWerewolf). */
  checksForSeer?: boolean;
  /** Mystic Seer only: investigation reveals the target's exact role name. */
  revealsExactRole?: boolean;
  /** Mentalist only: investigation checks if two selected targets share the same team. */
  dualTargetInvestigate?: boolean;
  /** Swapper only: requires two swap targets; resolves by swapping final night effects. */
  dualTargetSwap?: boolean;
  /** Exposer only: ability can only be used once per game. */
  oncePerGame?: boolean;
  /**
   * True for roles whose night action targets are restricted to adjacent seats.
   * The Thing may only tap immediate neighbors; the player list from
   * `game.playerOrder` is used to determine adjacency.
   */
  adjacentTargetOnly?: boolean;
  /** Illuminati only: on night 1, the narrator reveals all role assignments to this player. */
  revealsFullRoleList?: boolean;
  /** Used for grouping in the role config UI. */
  category: WerewolfRoleCategory;
}
