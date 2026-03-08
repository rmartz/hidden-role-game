import { GameMode } from "@/lib/models";
import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { GAME_MODE_ROLES } from "@/lib/game-modes";
import { assignRoles } from "./assignRoles";
import { SecretVillainService } from "./SecretVillainService";

export class WerewolfService {
  getRoleDefinitions(): RoleDefinition[] {
    return GAME_MODE_ROLES[GameMode.Werewolf];
  }

  createRoleAssignments(
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
  ): PlayerRoleAssignment[] {
    return assignRoles(players, roleSlots);
  }
}

export const werewolfService = new WerewolfService();
