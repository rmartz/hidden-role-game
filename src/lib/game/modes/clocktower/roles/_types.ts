import type { RoleDefinition } from "@/lib/types";
import { Team } from "@/lib/types";

// ---------------------------------------------------------------------------
// Character type enum
// ---------------------------------------------------------------------------

/**
 * Clocktower character types — sub-classifications within Team.
 * Good: Townsfolk | Outsider
 * Bad: Minion | Demon
 */
export enum ClocktowerCharacterType {
  Demon = "demon",
  Minion = "minion",
  Outsider = "outsider",
  Townsfolk = "townsfolk",
}

export const CLOCKTOWER_CHARACTER_TYPE_ORDER: ClocktowerCharacterType[] = [
  ClocktowerCharacterType.Townsfolk,
  ClocktowerCharacterType.Outsider,
  ClocktowerCharacterType.Minion,
  ClocktowerCharacterType.Demon,
];

export const CLOCKTOWER_CHARACTER_TYPE_LABELS: Record<
  ClocktowerCharacterType,
  string
> = {
  [ClocktowerCharacterType.Demon]: "Demon",
  [ClocktowerCharacterType.Minion]: "Minion",
  [ClocktowerCharacterType.Outsider]: "Outsider",
  [ClocktowerCharacterType.Townsfolk]: "Townsfolk",
};

// ---------------------------------------------------------------------------
// Role enum (alphabetical)
// ---------------------------------------------------------------------------

export enum ClocktowerRole {
  Baron = "clocktower-baron",
  Butler = "clocktower-butler",
  Chef = "clocktower-chef",
  Drunk = "clocktower-drunk",
  Empath = "clocktower-empath",
  FortuneTeller = "clocktower-fortune-teller",
  Imp = "clocktower-imp",
  Investigator = "clocktower-investigator",
  Librarian = "clocktower-librarian",
  Mayor = "clocktower-mayor",
  Monk = "clocktower-monk",
  Poisoner = "clocktower-poisoner",
  Ravenkeeper = "clocktower-ravenkeeper",
  Recluse = "clocktower-recluse",
  Saint = "clocktower-saint",
  ScarletWoman = "clocktower-scarlet-woman",
  Slayer = "clocktower-slayer",
  Soldier = "clocktower-soldier",
  Spy = "clocktower-spy",
  Undertaker = "clocktower-undertaker",
  Virgin = "clocktower-virgin",
  Washerwoman = "clocktower-washerwoman",
}

// ---------------------------------------------------------------------------
// Role definition interface
// ---------------------------------------------------------------------------

export interface ClocktowerRoleDefinition extends RoleDefinition<
  ClocktowerRole,
  Team
> {
  /** Clocktower sub-classification within Team. */
  characterType: ClocktowerCharacterType;
  /**
   * When true, this role is assigned to one player but that player sees a
   * random Townsfolk token instead. Their actual ability never works.
   * (Used exclusively by the Drunk.)
   */
  showsFakeTownsfolkToken?: true;
  /**
   * When true, this role may register as a different character type or team
   * than it actually is to other abilities (e.g. Recluse may register as evil).
   */
  registrationOverride?: true;
}
