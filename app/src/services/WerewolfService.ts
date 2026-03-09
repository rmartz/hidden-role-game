import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { WEREWOLF_ROLES, defaultRoleCount } from "@/lib/game-modes/werewolf";
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
    return defaultRoleCount(numPlayers);
  }
}

export const werewolfService = new WerewolfService();
