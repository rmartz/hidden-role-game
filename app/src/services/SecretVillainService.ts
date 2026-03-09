import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import {
  SECRET_VILLAIN_ROLES,
  defaultRoleCount,
} from "@/lib/game-modes/secret-villain";
import { assignRoles } from "./assignRoles";

export class SecretVillainService {
  readonly minPlayers = 5;

  getRoleDefinitions(): RoleDefinition[] {
    return Object.values(SECRET_VILLAIN_ROLES);
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

export const secretVillainService = new SecretVillainService();
