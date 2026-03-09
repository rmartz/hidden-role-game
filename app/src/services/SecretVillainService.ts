import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import {
  SECRET_VILLAIN_ROLES,
  SecretVillainRole,
} from "@/lib/game-modes/secret-villain-roles";
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
    const specialBad = 1;
    const bad = Math.floor((numPlayers - 1) / 2) - 1;
    const good = numPlayers - specialBad - bad;
    return [
      { roleId: SecretVillainRole.SpecialBad, count: specialBad },
      { roleId: SecretVillainRole.Bad, count: bad },
      { roleId: SecretVillainRole.Good, count: good },
    ];
  }
}

export const secretVillainService = new SecretVillainService();
