import { Team } from "@/lib/types";
import type { RoleBucket, RoleDefinition } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "./types";

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
  AlphaWolf = "werewolf-alpha-wolf",
  Altruist = "werewolf-altruist",
  Bodyguard = "werewolf-bodyguard",
  Chupacabra = "werewolf-chupacabra",
  Doctor = "werewolf-doctor",
  ElusiveSeer = "werewolf-elusive-seer",
  Executioner = "werewolf-executioner",
  Exposer = "werewolf-exposer",
  Hunter = "werewolf-hunter",
  LoneWolf = "werewolf-lone-wolf",
  Mason = "werewolf-mason",
  Mayor = "werewolf-mayor",
  Mentalist = "werewolf-mentalist",
  Minion = "werewolf-minion",
  Mirrorcaster = "werewolf-mirrorcaster",
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
  Tanner = "werewolf-tanner",
  ToughGuy = "werewolf-tough-guy",
  Vigilante = "werewolf-vigilante",
  VillageDrunk = "werewolf-village-drunk",
  VillageIdiot = "werewolf-village-idiot",
  Villager = "werewolf-villager",
  Werewolf = "werewolf-werewolf",
  Witch = "werewolf-witch",
  Wizard = "werewolf-wizard",
  WolfCub = "werewolf-wolf-cub",
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
  /** Exposer only: ability can only be used once per game. */
  oncePerGame?: boolean;
  /** Used for grouping in the role config UI. */
  category: WerewolfRoleCategory;
}

export const MIN_PLAYERS = 7;

/** Minimum number of players who receive roles (= MIN_PLAYERS - 1, excluding the Narrator). */
export const MIN_ROLE_PLAYERS = MIN_PLAYERS - 1;

export function defaultRoleCount(numRolePlayers: number): RoleBucket[] {
  // numRolePlayers is already the number of role-receiving players (Narrator excluded by caller).
  // Includes any hidden unassigned role slots (hiddenRoleCount).
  // Werewolf count: 6-8 role-players → 1, 9-11 → 2, 12-14 → 3, etc.
  const n = Math.max(numRolePlayers, MIN_ROLE_PLAYERS);
  const werewolves = Math.max(1, Math.floor((n - 3) / 3));
  const villagers = n - werewolves - 1;
  return [
    { playerCount: werewolves, roleId: WerewolfRole.Werewolf },
    { playerCount: villagers, roleId: WerewolfRole.Villager },
    { playerCount: 1, roleId: WerewolfRole.Seer },
  ];
}

export const WEREWOLF_ROLES: Record<WerewolfRole, WerewolfRoleDefinition> = {
  [WerewolfRole.AlphaWolf]: {
    id: WerewolfRole.AlphaWolf,
    name: "Alpha Wolf",
    summary:
      "Once per game, converts a villager to the Werewolf team instead of killing",
    description:
      "The Alpha Wolf wakes with the Werewolves each night. Once per game, instead of a standard kill, the Alpha Wolf may bite a villager — secretly converting them to the Werewolf team. Alternatively, the Alpha Wolf may use their ability to eliminate an additional villager that same night.",
    team: Team.Bad,
    isWerewolf: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Special,
    wakesWith: WerewolfRole.Werewolf,
    awareOf: { werewolves: true },
    oncePerGame: true,
    unique: true,
    category: WerewolfRoleCategory.EvilKilling,
  },
  [WerewolfRole.Altruist]: {
    id: WerewolfRole.Altruist,
    name: "Altruist",
    summary: "Sacrifices themselves to save an attacked player",
    description:
      "Each night, after the Werewolves have chosen their target, the Altruist learns which players are under attack. They may intercept one attack, saving the original target — but dying in their place. If the Altruist is themselves under attack, their intercept is ignored.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Special,
    category: WerewolfRoleCategory.VillagerProtection,
  },
  [WerewolfRole.Bodyguard]: {
    id: WerewolfRole.Bodyguard,
    name: "Bodyguard",
    summary: "Protects a player from elimination each night",
    description:
      "Each night the Bodyguard chooses one player to protect. If that player is attacked, they survive. The Bodyguard cannot protect the same player on consecutive nights.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Protect,
    preventRepeatTarget: true,
    category: WerewolfRoleCategory.VillagerProtection,
  },
  [WerewolfRole.Chupacabra]: {
    id: WerewolfRole.Chupacabra,
    name: "Chupacabra",
    summary: "A neutral predator that hunts Werewolves",
    description:
      "Each night the Chupacabra targets one player. The attack only succeeds if the target is a Werewolf — once all Werewolves have been eliminated, the Chupacabra can attack anyone. The Chupacabra is neutral and has its own win condition.",
    team: Team.Neutral,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Attack,
    category: WerewolfRoleCategory.NeutralKilling,
  },
  [WerewolfRole.Doctor]: {
    id: WerewolfRole.Doctor,
    name: "Doctor",
    summary: "Protects a player from elimination each night",
    description:
      "Each night the Doctor chooses one player to protect from werewolf attacks. Unlike the Bodyguard, the Doctor can protect the same player on consecutive nights but cannot protect themselves.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Protect,
    preventSelfTarget: true,
    aliases: ["healer", "medic"],
    category: WerewolfRoleCategory.VillagerProtection,
  },
  [WerewolfRole.ElusiveSeer]: {
    id: WerewolfRole.ElusiveSeer,
    name: "Elusive Seer",
    summary: "On the first night, learns every plain Villager",
    description:
      "On the first night only, the Elusive Seer wakes and is shown the identity of every plain Villager in the game. They have no night action on subsequent nights.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.FirstNightOnly,
    targetCategory: TargetCategory.None,
    category: WerewolfRoleCategory.VillagerInvestigation,
  },
  [WerewolfRole.Executioner]: {
    id: WerewolfRole.Executioner,
    name: "Executioner",
    summary: "Wins by getting their target eliminated at trial",
    description:
      "The Executioner is a Neutral player assigned a secret target at the start of the game. If the Executioner's target is eliminated by a daytime trial vote — and the Executioner is still alive — the Executioner wins.",
    team: Team.Neutral,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
    category: WerewolfRoleCategory.NeutralManipulation,
  },
  [WerewolfRole.Exposer]: {
    id: WerewolfRole.Exposer,
    name: "Exposer",
    summary: "Once per game, publicly reveals a player's role",
    description:
      "Once per game, the Exposer may target a player at night. When confirmed, that player's role is publicly revealed to all players at the start of the following day. This ability can only be used once.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Special,
    oncePerGame: true,
    category: WerewolfRoleCategory.VillagerInvestigation,
  },
  [WerewolfRole.Hunter]: {
    id: WerewolfRole.Hunter,
    name: "Hunter",
    summary: "When killed, eliminates one player of their choice",
    description:
      "When the Hunter dies — whether by wolf attack or village trial — they immediately take one player down with them. The narrator selects the Hunter's revenge target. This revenge kill cannot be blocked by any protection.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
    aliases: ["gunslinger"],
    category: WerewolfRoleCategory.VillagerKilling,
  },
  [WerewolfRole.LoneWolf]: {
    id: WerewolfRole.LoneWolf,
    name: "Lone Wolf",
    summary: "A rogue werewolf with its own win condition",
    description:
      "The Lone Wolf wakes with the Werewolves each night and participates in their hunt. Werewolves do not know which of their wake partners is the Lone Wolf. The Lone Wolf wins alone — if they are the last wolf-aligned player alive and outnumber or match non-wolf players, the Lone Wolf wins instead of Team Bad.",
    team: Team.Neutral,
    isWerewolf: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.None,
    wakesWith: WerewolfRole.Werewolf,
    awareOf: { werewolves: true },
    category: WerewolfRoleCategory.NeutralKilling,
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
    aliases: ["brother", "freemason"],
    category: WerewolfRoleCategory.VillagerSupport,
  },
  [WerewolfRole.Mayor]: {
    id: WerewolfRole.Mayor,
    name: "Mayor",
    summary: "Vote counts double in daytime trials",
    description:
      "The Mayor is a Good-team member whose vote secretly counts double in daytime elimination trials. No one else knows the Mayor's identity.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
    category: WerewolfRoleCategory.VillagerSupport,
  },
  [WerewolfRole.Mentalist]: {
    id: WerewolfRole.Mentalist,
    name: "Mentalist",
    summary: "Learns if two chosen players share the same team",
    description:
      "Each night the Mentalist selects two players and the Narrator privately reveals whether those two players are on the same team. The Mentalist does not learn either player's specific role — only whether their teams match.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Investigate,
    dualTargetInvestigate: true,
    category: WerewolfRoleCategory.VillagerInvestigation,
  },
  [WerewolfRole.Minion]: {
    id: WerewolfRole.Minion,
    name: "Minion",
    summary: "A secret servant of the werewolves",
    description:
      "The Minion knows who the Werewolves are, but the Werewolves do not know the Minion's identity. The Minion wins with the Werewolves. The Seer's investigation reveals the Minion is not a Werewolf.",
    team: Team.Bad,
    unique: true,
    awareOf: { werewolves: true },
    wakesAtNight: WakesAtNight.FirstNightOnly,
    targetCategory: TargetCategory.None,
    aliases: ["servant", "thrall"],
    category: WerewolfRoleCategory.EvilSupport,
  },
  [WerewolfRole.Mirrorcaster]: {
    id: WerewolfRole.Mirrorcaster,
    name: "Mirrorcaster",
    summary:
      "Protects players; gains an attack charge when protection succeeds",
    description:
      "The Mirrorcaster starts in Protect mode, choosing a player to shield each night. When the protected player is attacked, the Mirrorcaster gains a charge and switches to Attack mode. Their next night action is an attack (blockable by protections). After attacking, the charge is consumed and they return to Protect mode.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Special,
    preventSelfTarget: true,
    category: WerewolfRoleCategory.VillagerProtection,
  },
  [WerewolfRole.Mortician]: {
    id: WerewolfRole.Mortician,
    name: "Mortician",
    summary: "Attacks each night until they kill a Werewolf",
    description:
      "Each night, the Mortician targets one player to attack. If the target is protected, the attack fails and the Mortician receives a 'not a Werewolf' result regardless of the target's actual role. Once the Mortician successfully kills a Werewolf, their ability ends and they no longer wake at night.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Attack,
    preventSelfTarget: true,
    category: WerewolfRoleCategory.VillagerKilling,
  },
  [WerewolfRole.Mummy]: {
    id: WerewolfRole.Mummy,
    name: "Mummy",
    summary: "Hypnotizes a player whose vote mirrors theirs",
    description:
      "Each night the Mummy selects a player to hypnotize. The following day, the hypnotized player's trial vote is automatically cast to match the Mummy's vote. The Mummy selects a new target each night.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Special,
    category: WerewolfRoleCategory.VillagerSupport,
  },
  [WerewolfRole.MysticSeer]: {
    id: WerewolfRole.MysticSeer,
    name: "Mystic Seer",
    summary: "Learns a player's exact role each night",
    description:
      "Each night the Mystic Seer targets one player and the Narrator privately reveals that player's exact role — not merely whether they are a Werewolf. This is significantly more powerful than the Seer.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Investigate,
    revealsExactRole: true,
    category: WerewolfRoleCategory.VillagerInvestigation,
  },
  [WerewolfRole.OldMan]: {
    id: WerewolfRole.OldMan,
    name: "Old Man",
    summary: "Dies peacefully after a set number of nights",
    description:
      "The Old Man has no special protections — wolves can attack and kill them normally. However, if the Old Man is still alive after (#Werewolves + 2) nights, they die peacefully in their sleep at the start of day.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
    category: WerewolfRoleCategory.VillagerHandicap,
  },
  [WerewolfRole.OneEyedSeer]: {
    id: WerewolfRole.OneEyedSeer,
    name: "One-Eyed Seer",
    summary: "Investigates players but locks onto detected Werewolves",
    description:
      "Each night the One-Eyed Seer targets one player and the Narrator privately reveals whether that player is a Werewolf (same check as the Seer). However, if the investigation reveals a Werewolf, the One-Eyed Seer is locked on — they cannot investigate any new players until that Werewolf is eliminated.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Investigate,
    category: WerewolfRoleCategory.VillagerInvestigation,
  },
  [WerewolfRole.Pacifist]: {
    id: WerewolfRole.Pacifist,
    name: "Pacifist",
    summary: "Always votes to acquit in daytime trials",
    description:
      "The Pacifist is a Good-team member who is compelled to always vote Innocent in daytime elimination trials. Their vote is automatically cast when a trial begins.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
    alwaysVotesInnocent: true,
    category: WerewolfRoleCategory.VillagerHandicap,
  },
  [WerewolfRole.Priest]: {
    id: WerewolfRole.Priest,
    name: "Priest",
    summary: "Places a permanent ward on a player",
    description:
      "The Priest selects a player to place a ward on. The ward persists until the protected player is attacked, at which point the ward is consumed and the Priest selects a new target on the following night.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Protect,
    category: WerewolfRoleCategory.VillagerProtection,
  },
  [WerewolfRole.Seer]: {
    id: WerewolfRole.Seer,
    name: "Seer",
    summary: "Discovers if a player is evil each night",
    description:
      "Each night the Seer targets one player and the Narrator privately reveals whether that player is a Werewolf. Only Werewolves and Wolf Cubs are detected — other evil roles such as the Minion are not.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Investigate,
    aliases: ["oracle", "prophet"],
    category: WerewolfRoleCategory.VillagerInvestigation,
  },
  [WerewolfRole.Sentinel]: {
    id: WerewolfRole.Sentinel,
    name: "Sentinel",
    summary: "Knows who the Seer is and can protect their identity",
    description:
      "The Sentinel wakes on the first night and learns the identity of the Seer. They have no night action — their role is to use this knowledge to protect the Seer during daytime discussion without revealing them to the Werewolves.",
    team: Team.Good,
    unique: true,
    awareOf: { roles: [WerewolfRole.Seer] },
    wakesAtNight: WakesAtNight.FirstNightOnly,
    targetCategory: TargetCategory.None,
    category: WerewolfRoleCategory.VillagerSupport,
  },
  [WerewolfRole.Spellcaster]: {
    id: WerewolfRole.Spellcaster,
    name: "Spellcaster",
    summary: "Silences a player each night",
    description:
      "Each night the Spellcaster targets one player who is silenced the following day and cannot speak. The Spellcaster cannot target the same player on consecutive nights.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Special,
    preventRepeatTarget: true,
    category: WerewolfRoleCategory.VillagerSupport,
  },
  [WerewolfRole.Spoiler]: {
    id: WerewolfRole.Spoiler,
    name: "Spoiler",
    summary: "Wins whenever anyone else wins",
    description:
      "The Spoiler is a Neutral player who wins whenever a standard win condition is met — as long as the Spoiler is still alive. If the Village wins, the Spoiler wins. If the Werewolves win, the Spoiler wins instead.",
    team: Team.Neutral,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
    category: WerewolfRoleCategory.NeutralManipulation,
  },
  [WerewolfRole.Tanner]: {
    id: WerewolfRole.Tanner,
    name: "Tanner",
    summary: "Wins by getting eliminated",
    description:
      "The Tanner is a Neutral player who wins by being eliminated — either by the Werewolves at night or by the village at trial. The Tanner has no special abilities and no night action.",
    team: Team.Neutral,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
    category: WerewolfRoleCategory.NeutralManipulation,
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
    category: WerewolfRoleCategory.VillagerSupport,
  },
  [WerewolfRole.Vigilante]: {
    id: WerewolfRole.Vigilante,
    name: "Vigilante",
    summary:
      "Kills a player each night starting night 2; dies if target is Good",
    description:
      "Starting on the second night, the Vigilante may choose one player to eliminate. If the target is protected, the kill is blocked. If the Vigilante successfully kills a Good-team player, the Vigilante also dies at the start of the following day.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.AfterFirstNight,
    targetCategory: TargetCategory.Attack,
    preventSelfTarget: true,
    category: WerewolfRoleCategory.VillagerKilling,
  },
  [WerewolfRole.VillageDrunk]: {
    id: WerewolfRole.VillageDrunk,
    name: "Village Drunk",
    summary:
      "Cannot speak normally; gets sober on night 3 and gains an alternate role",
    description:
      "The Village Drunk is mute until they sober up. At the start of night 3, the Village Drunk sobers up and takes on an alternate role (configured by the narrator before the game starts). From that point they play as that new role.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
    category: WerewolfRoleCategory.VillagerHandicap,
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
    category: WerewolfRoleCategory.VillagerHandicap,
  },
  [WerewolfRole.Villager]: {
    id: WerewolfRole.Villager,
    name: "Villager",
    summary: "An ordinary member of the village",
    description:
      "The Villager has no special abilities and no night action. They must rely on their wits and discussion during the day to identify and eliminate the Werewolves.",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
    targetCategory: TargetCategory.None,
    aliases: ["peasant", "town", "townsfolk"],
    category: WerewolfRoleCategory.VillagerSupport,
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
    aliases: ["wolf", "wolves"],
    category: WerewolfRoleCategory.EvilKilling,
  },
  [WerewolfRole.Witch]: {
    id: WerewolfRole.Witch,
    name: "Witch",
    summary: "Has a one-time power to protect or strike",
    description:
      "After all other night roles have acted, the Witch may use her special ability: either protect the player who was attacked that night, or attack any other player. This ability can only be used once per game.",
    team: Team.Good,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Special,
    aliases: ["potion"],
    category: WerewolfRoleCategory.VillagerProtection,
  },
  [WerewolfRole.Wizard]: {
    id: WerewolfRole.Wizard,
    name: "Wizard",
    summary: "Aligned with the Werewolves, secretly hunts the Seer",
    description:
      "The Wizard wins with the Werewolves but operates alone — the wolves don't know the Wizard, and the Wizard doesn't know the wolves. Each night the Wizard targets one player and the Narrator privately reveals whether that player is the Seer. The Seer's own investigation returns 'not a Werewolf' for the Wizard.",
    team: Team.Bad,
    unique: true,
    wakesAtNight: WakesAtNight.EveryNight,
    targetCategory: TargetCategory.Investigate,
    checksForSeer: true,
    category: WerewolfRoleCategory.EvilSupport,
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
    category: WerewolfRoleCategory.EvilKilling,
  },
} satisfies Record<WerewolfRole, WerewolfRoleDefinition>;

/** Returns true if the given string is a known WerewolfRole. */
export function isWerewolfRole(id: string): id is WerewolfRole {
  return id in WEREWOLF_ROLES;
}

/** Look up a WerewolfRoleDefinition by string ID, returning undefined if not found. */
export function getWerewolfRole(
  id: string,
): WerewolfRoleDefinition | undefined {
  if (!isWerewolfRole(id)) return undefined;
  return WEREWOLF_ROLES[id];
}
