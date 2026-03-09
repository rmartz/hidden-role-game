import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { WEREWOLF_ROLES, WerewolfRole } from "@/lib/game-modes/werewolf-roles";
import { assignRoles } from "./assignRoles";

export class WerewolfService {
  readonly minPlayers = 5;

  getRoleDefinitions(): RoleDefinition[] {
    return Object.values(WEREWOLF_ROLES);
  }

  createRoleAssignments(
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
  ): PlayerRoleAssignment[] {
    return assignRoles(players, roleSlots);
  }

  defaultRoleCount(numPlayers: number): RoleSlot[] {
    const bad = Math.floor(numPlayers / 3);
    const good = numPlayers - bad;
    return [
      { roleId: WerewolfRole.Bad, count: bad },
      { roleId: WerewolfRole.Good, count: good },
    ];
  }
}

export const werewolfService = new WerewolfService();
