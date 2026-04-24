import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";
import { ClocktowerPhase } from "../types";
import type { ClocktowerTurnState } from "../types";

function currentTurnState(game: Game): ClocktowerTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as ClocktowerTurnState | undefined;
}

/**
 * Resolves which role ID the caller is acting for.
 * The Storyteller may pass an explicit `roleId`; players use their own assignment.
 */
function resolveActingRoleId(
  game: Game,
  callerId: string,
  roleId: string | undefined,
): string | undefined {
  if (callerId === game.ownerPlayerId) {
    return typeof roleId === "string" ? roleId : undefined;
  }
  return game.roleAssignments.find((a) => a.playerId === callerId)
    ?.roleDefinitionId;
}

/**
 * Player selects their night target.
 *
 * The Storyteller (ownerPlayerId) may submit targets for any role by providing
 * an explicit `roleId` in the payload. Players submit for their own assigned role.
 *
 * Payload:
 *   - roleId?: string              — Storyteller only: which role's action to set
 *   - targetPlayerId?: string      — primary target (omit to clear)
 *   - secondTargetPlayerId?: string — Fortune Teller only: second target
 */
export const setNightTargetAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== ClocktowerPhase.Night) return false;

    const { roleId, targetPlayerId, secondTargetPlayerId } = payload as {
      roleId?: unknown;
      targetPlayerId?: unknown;
      secondTargetPlayerId?: unknown;
    };

    const activeRoleId = resolveActingRoleId(
      game,
      callerId,
      typeof roleId === "string" ? roleId : undefined,
    );
    if (!activeRoleId) return false;

    // Prevent changing a confirmed target
    const existing = ts.phase.nightActions[activeRoleId];
    if (existing?.confirmed) return false;

    // targetPlayerId undefined = clear; string = set target
    if (targetPlayerId === undefined) return true;
    if (typeof targetPlayerId !== "string") return false;
    if (!game.players.some((p) => p.id === targetPlayerId)) return false;
    if (ts.deadPlayerIds.includes(targetPlayerId)) return false;
    // Cannot target the Storyteller
    if (targetPlayerId === game.ownerPlayerId) return false;

    // Validate secondTargetPlayerId with the same constraints as targetPlayerId.
    if (secondTargetPlayerId !== undefined) {
      if (typeof secondTargetPlayerId !== "string") return false;
      if (!game.players.some((p) => p.id === secondTargetPlayerId))
        return false;
      if (ts.deadPlayerIds.includes(secondTargetPlayerId)) return false;
      if (secondTargetPlayerId === game.ownerPlayerId) return false;
    }

    return true;
  },

  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (!ts) return;
    if (ts.phase.type !== ClocktowerPhase.Night) return;

    const { roleId, targetPlayerId, secondTargetPlayerId } = payload as {
      roleId?: string;
      targetPlayerId?: string;
      secondTargetPlayerId?: string;
    };

    const activeRoleId = resolveActingRoleId(game, callerId, roleId);
    if (!activeRoleId) return;

    const phase = ts.phase;
    const existing = phase.nightActions[activeRoleId] ?? {};

    if (targetPlayerId === undefined) {
      const updated = { ...existing };
      delete updated.targetPlayerId;
      phase.nightActions[activeRoleId] = updated;
    } else {
      phase.nightActions[activeRoleId] = {
        ...existing,
        targetPlayerId,
        ...(secondTargetPlayerId !== undefined ? { secondTargetPlayerId } : {}),
      };
    }
  },
};
