import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";
import { ClocktowerPhase } from "../types";
import type { ClocktowerTurnState } from "../types";
import {
  ClocktowerRole,
  ClocktowerCharacterType,
  CLOCKTOWER_ROLES,
} from "../roles";

function currentTurnState(game: Game): ClocktowerTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as ClocktowerTurnState | undefined;
}

function getPlayerRole(
  game: Game,
  playerId: string,
): ClocktowerRole | undefined {
  const assignment = game.roleAssignments.find((a) => a.playerId === playerId);
  if (!assignment) return undefined;
  const roleId = assignment.roleDefinitionId;
  return Object.values(ClocktowerRole).includes(roleId as ClocktowerRole)
    ? (roleId as ClocktowerRole)
    : undefined;
}

/**
 * Returns true if the nominator's role is Townsfolk (not poisoned).
 * Used for Virgin's one-time ability check.
 */
function isUnpoisonedTownsfolk(
  game: Game,
  playerId: string,
  ts: ClocktowerTurnState,
): boolean {
  if (ts.poisonedPlayerId === playerId) return false;
  const role = getPlayerRole(game, playerId);
  if (!role) return false;
  return (
    CLOCKTOWER_ROLES[role].characterType === ClocktowerCharacterType.Townsfolk
  );
}

export const nominatePlayerAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== ClocktowerPhase.Day) return false;
    // Only one execution per day
    if (ts.phase.executedToday !== undefined) return false;
    // Dead players cannot nominate
    if (ts.deadPlayerIds.includes(callerId)) return false;
    // Each player may only nominate once per day
    if (ts.phase.nominatedByPlayerIds.includes(callerId)) return false;

    const { nomineeId } = payload as { nomineeId?: unknown };
    if (typeof nomineeId !== "string") return false;
    // Cannot nominate yourself
    if (nomineeId === callerId) return false;
    // Must be a valid player
    if (!game.players.some((p) => p.id === nomineeId)) return false;

    // Each player may only be nominated once per day
    if (ts.phase.nominations.some((n) => n.nomineeId === nomineeId))
      return false;

    // Butler cannot nominate their master
    const callerRole = getPlayerRole(game, callerId);
    if (
      callerRole === ClocktowerRole.Butler &&
      ts.butlerMasterId === nomineeId
    ) {
      return false;
    }

    return true;
  },

  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== ClocktowerPhase.Day) return;

    const { nomineeId } = payload as { nomineeId: string };

    // Virgin ability: if Virgin is nominated for the first time by a Townsfolk,
    // the nominator is immediately executed and the nomination does not proceed.
    const nomineeRole = getPlayerRole(game, nomineeId);
    if (
      nomineeRole === ClocktowerRole.Virgin &&
      !ts.virginAbilityUsed &&
      isUnpoisonedTownsfolk(game, callerId, ts)
    ) {
      ts.virginAbilityUsed = true;
      // Execute the nominator immediately — nomination ends here
      ts.phase.executedToday = callerId;
      if (!ts.deadPlayerIds.includes(callerId)) {
        ts.deadPlayerIds = [...ts.deadPlayerIds, callerId];
      }
      // Record the nominator as having nominated today so they cannot nominate again
      ts.phase.nominatedByPlayerIds = [
        ...ts.phase.nominatedByPlayerIds,
        callerId,
      ];
      return;
    }

    ts.phase.nominations = [
      ...ts.phase.nominations,
      { nominatorId: callerId, nomineeId, votes: [] },
    ];
    ts.phase.nominatedByPlayerIds = [
      ...ts.phase.nominatedByPlayerIds,
      callerId,
    ];
  },
};
