import { Team } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying, resolveRoleId } from "../utils";
import { WerewolfRole, getWerewolfRole } from "../roles";

/**
 * Alpha Wolf Bite: narrator converts a villager to the Werewolf team.
 * Can only be used once per game (alphaWolfBiteUsed).
 * Target must be a living non-werewolf-team player.
 * After the bite, the target's role is overridden to Werewolf in roleOverrides.
 *
 * This action is narrator-only and can be used during any night phase while
 * the Alpha Wolf is alive.
 */
export const alphaWolfBiteAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;
    if (ts.alphaWolfBiteUsed) return false;

    // Alpha Wolf must be alive.
    const alphaWolfAssignment = game.roleAssignments.find(
      (a) => a.roleDefinitionId === (WerewolfRole.AlphaWolf as string),
    );
    if (!alphaWolfAssignment) return false;
    if (ts.deadPlayerIds.includes(alphaWolfAssignment.playerId)) return false;

    if (!payload || typeof payload !== "object") return false;
    const { targetPlayerId } = payload as { targetPlayerId?: unknown };
    if (typeof targetPlayerId !== "string") return false;
    if (!game.players.some((p) => p.id === targetPlayerId)) return false;
    if (ts.deadPlayerIds.includes(targetPlayerId)) return false;
    // Cannot bite the narrator/owner.
    if (targetPlayerId === game.ownerPlayerId) return false;

    // Cannot bite someone already on the werewolf team.
    const targetRoleId = resolveRoleId(
      targetPlayerId,
      game.roleAssignments,
      ts.roleOverrides,
    );
    if (!targetRoleId) return false;
    const targetRole = getWerewolfRole(targetRoleId);
    if (!targetRole) return false;
    if (targetRole.team === Team.Bad || targetRole.isWerewolf) return false;

    return true;
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return;

    const { targetPlayerId } = payload as { targetPlayerId: string };

    ts.alphaWolfBiteUsed = true;
    ts.roleOverrides = {
      ...(ts.roleOverrides ?? {}),
      [targetPlayerId]: WerewolfRole.Werewolf,
    };
  },
};
