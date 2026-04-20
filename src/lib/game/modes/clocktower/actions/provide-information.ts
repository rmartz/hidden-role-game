import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";
import { ClocktowerPhase } from "../types";
import type { ClocktowerNightInformation, ClocktowerTurnState } from "../types";
import { isClocktowerRole } from "../roles";

function currentTurnState(game: Game): ClocktowerTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as ClocktowerTurnState | undefined;
}

interface InfoCandidate {
  type?: unknown;
  value?: unknown;
  roleId?: unknown;
  playerIds?: unknown;
}

function isValidInformation(
  game: Game,
  info: unknown,
): info is ClocktowerNightInformation {
  if (typeof info !== "object" || info === null) return false;
  const candidate = info as InfoCandidate;

  switch (candidate.type) {
    case "number":
      return typeof candidate.value === "number";

    case "boolean":
      return typeof candidate.value === "boolean";

    case "role":
      return (
        typeof candidate.roleId === "string" &&
        isClocktowerRole(candidate.roleId)
      );

    case "two-players-role": {
      if (
        !Array.isArray(candidate.playerIds) ||
        candidate.playerIds.length !== 2
      )
        return false;
      const [a, b] = candidate.playerIds as unknown[];
      if (typeof a !== "string" || typeof b !== "string") return false;
      if (!game.players.some((p) => p.id === a)) return false;
      if (!game.players.some((p) => p.id === b)) return false;
      if (typeof candidate.roleId !== "string") return false;
      if (!isClocktowerRole(candidate.roleId)) return false;
      return true;
    }

    default:
      return false;
  }
}

/**
 * Storyteller enters information for a role that wakes at night.
 *
 * This is Storyteller-only (ownerPlayerId). Night actions are keyed by role ID.
 *
 * Information shapes by role:
 *   - Empath, Chef             → `{ type: "number", value: number }`
 *   - Fortune Teller           → `{ type: "boolean", value: boolean }`
 *   - Washerwoman, Librarian,
 *     Investigator             → `{ type: "two-players-role", playerIds: [id, id], roleId }`
 *   - Undertaker, Ravenkeeper  → `{ type: "role", roleId: string }`
 *
 * Payload:
 *   - roleId: string                   — which role is receiving information
 *   - information: ClocktowerNightInformation — the info to record
 */
export const provideInformationAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    // Only the Storyteller may provide information
    if (callerId !== game.ownerPlayerId) return false;

    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== ClocktowerPhase.Night) return false;

    const { roleId, information } = payload as {
      roleId?: unknown;
      information?: unknown;
    };

    if (typeof roleId !== "string") return false;
    if (!isClocktowerRole(roleId)) return false;
    if (!isValidInformation(game, information)) return false;

    return true;
  },

  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;
    if (ts.phase.type !== ClocktowerPhase.Night) return;

    const { roleId, information } = payload as {
      roleId: string;
      information: ClocktowerNightInformation;
    };

    const phase = ts.phase;
    const existing = phase.nightActions[roleId] ?? {};
    phase.nightActions[roleId] = { ...existing, information };
  },
};
