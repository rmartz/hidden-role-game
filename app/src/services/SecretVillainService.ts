import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { SECRET_VILLAIN_CONFIG } from "@/lib/game-modes/secret-villain";
import { assignRoles } from "./assignRoles";

export class SecretVillainService {
  readonly minPlayers = SECRET_VILLAIN_CONFIG.minPlayers;

  getRoleDefinitions(): RoleDefinition[] {
    return Object.values(SECRET_VILLAIN_CONFIG.roles);
  }

  createRoleAssignments(
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
  ): PlayerRoleAssignment[] {
    return assignRoles(players, roleSlots);
  }

  defaultRoleCount(numPlayers: number): RoleSlot[] {
    return SECRET_VILLAIN_CONFIG.defaultRoleCount(numPlayers);
  }
}

export const secretVillainService = new SecretVillainService();
