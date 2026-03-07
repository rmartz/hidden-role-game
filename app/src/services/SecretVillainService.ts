import { GameMode } from "@/lib/models";
import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { GAME_MODE_ROLES } from "@/lib/game-modes";
import { assignRoles } from "./assignRoles";

export class SecretVillainService {
  getRoleDefinitions(): RoleDefinition[] {
    return GAME_MODE_ROLES[GameMode.SecretVillain];
  }

  createRoleAssignments(
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
  ): PlayerRoleAssignment[] {
    return assignRoles(players, roleSlots);
  }
}

export const secretVillainService = new SecretVillainService();
