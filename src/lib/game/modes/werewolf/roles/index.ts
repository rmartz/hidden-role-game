export * from "./_types";
export * from "./_config";

import { WerewolfRole } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";
import { ALTRUIST_ROLE } from "./altruist";
import { ARSONIST_ROLE } from "./arsonist";
import { BODYGUARD_ROLE } from "./bodyguard";
import { CHUPACABRA_ROLE } from "./chupacabra";
import { DOCTOR_ROLE } from "./doctor";
import { DRACULA_ROLE } from "./dracula";
import { ELUSIVE_SEER_ROLE } from "./elusive-seer";
import { EXECUTIONER_ROLE } from "./executioner";
import { EXPOSER_ROLE } from "./exposer";
import { HUNTER_ROLE } from "./hunter";
import { ILLUMINATI_ROLE } from "./illuminati";
import { LONE_WOLF_ROLE } from "./lone-wolf";
import { MASON_ROLE } from "./mason";
import { MAYOR_ROLE } from "./mayor";
import { MENTALIST_ROLE } from "./mentalist";
import { MERCENARY_ROLE } from "./mercenary";
import { MINION_ROLE } from "./minion";
import { MIRRORCASTER_ROLE } from "./mirrorcaster";
import { MONARCH_ROLE } from "./monarch";
import { MORTICIAN_ROLE } from "./mortician";
import { MUMMY_ROLE } from "./mummy";
import { MYSTIC_SEER_ROLE } from "./mystic-seer";
import { OLD_MAN_ROLE } from "./old-man";
import { ONE_EYED_SEER_ROLE } from "./one-eyed-seer";
import { PACIFIST_ROLE } from "./pacifist";
import { PRIEST_ROLE } from "./priest";
import { SEER_ROLE } from "./seer";
import { SENTINEL_ROLE } from "./sentinel";
import { SPELLCASTER_ROLE } from "./spellcaster";
import { SPOILER_ROLE } from "./spoiler";
import { SWAPPER_ROLE } from "./swapper";
import { TANNER_ROLE } from "./tanner";
import { TOUGH_GUY_ROLE } from "./tough-guy";
import { VIGILANTE_ROLE } from "./vigilante";
import { VILLAGE_IDIOT_ROLE } from "./village-idiot";
import { VILLAGER_ROLE } from "./villager";
import { WEREWOLF_ROLE } from "./werewolf-role";
import { WITCH_ROLE } from "./witch";
import { WIZARD_ROLE } from "./wizard";
import { WOLF_CUB_ROLE } from "./wolf-cub";
import { ZOMBIE_ROLE } from "./zombie";

export const WEREWOLF_ROLES: Record<WerewolfRole, WerewolfRoleDefinition> = {
  [WerewolfRole.Altruist]: ALTRUIST_ROLE,
  [WerewolfRole.Arsonist]: ARSONIST_ROLE,
  [WerewolfRole.Bodyguard]: BODYGUARD_ROLE,
  [WerewolfRole.Chupacabra]: CHUPACABRA_ROLE,
  [WerewolfRole.Doctor]: DOCTOR_ROLE,
  [WerewolfRole.Dracula]: DRACULA_ROLE,
  [WerewolfRole.ElusiveSeer]: ELUSIVE_SEER_ROLE,
  [WerewolfRole.Executioner]: EXECUTIONER_ROLE,
  [WerewolfRole.Exposer]: EXPOSER_ROLE,
  [WerewolfRole.Hunter]: HUNTER_ROLE,
  [WerewolfRole.Illuminati]: ILLUMINATI_ROLE,
  [WerewolfRole.LoneWolf]: LONE_WOLF_ROLE,
  [WerewolfRole.Mason]: MASON_ROLE,
  [WerewolfRole.Mayor]: MAYOR_ROLE,
  [WerewolfRole.Mentalist]: MENTALIST_ROLE,
  [WerewolfRole.Mercenary]: MERCENARY_ROLE,
  [WerewolfRole.Minion]: MINION_ROLE,
  [WerewolfRole.Mirrorcaster]: MIRRORCASTER_ROLE,
  [WerewolfRole.Monarch]: MONARCH_ROLE,
  [WerewolfRole.Mortician]: MORTICIAN_ROLE,
  [WerewolfRole.Mummy]: MUMMY_ROLE,
  [WerewolfRole.MysticSeer]: MYSTIC_SEER_ROLE,
  [WerewolfRole.OldMan]: OLD_MAN_ROLE,
  [WerewolfRole.OneEyedSeer]: ONE_EYED_SEER_ROLE,
  [WerewolfRole.Pacifist]: PACIFIST_ROLE,
  [WerewolfRole.Priest]: PRIEST_ROLE,
  [WerewolfRole.Seer]: SEER_ROLE,
  [WerewolfRole.Sentinel]: SENTINEL_ROLE,
  [WerewolfRole.Spellcaster]: SPELLCASTER_ROLE,
  [WerewolfRole.Spoiler]: SPOILER_ROLE,
  [WerewolfRole.Swapper]: SWAPPER_ROLE,
  [WerewolfRole.Tanner]: TANNER_ROLE,
  [WerewolfRole.ToughGuy]: TOUGH_GUY_ROLE,
  [WerewolfRole.Vigilante]: VIGILANTE_ROLE,
  [WerewolfRole.VillageIdiot]: VILLAGE_IDIOT_ROLE,
  [WerewolfRole.Villager]: VILLAGER_ROLE,
  [WerewolfRole.Werewolf]: WEREWOLF_ROLE,
  [WerewolfRole.Witch]: WITCH_ROLE,
  [WerewolfRole.Wizard]: WIZARD_ROLE,
  [WerewolfRole.WolfCub]: WOLF_CUB_ROLE,
  [WerewolfRole.Zombie]: ZOMBIE_ROLE,
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
