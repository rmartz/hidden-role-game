import { GameStatus, Team } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfRole, WEREWOLF_ROLES } from "../roles";

/**
 * Checks the current win condition for a Werewolf game.
 * Returns a Finished status with the winner if a win condition is met,
 * or undefined if the game should continue.
 *
 * Priority (when badAlive === 0):
 * 1. Chupacabra wins: no Bad players alive, Chupacabra alive, ≤1 Good player alive
 * 2. Village wins: no Bad players alive AND no Neutral players alive
 *    (Chupacabra still alive → game continues until Chupacabra wins or is eliminated)
 * 3. Werewolves win: Bad team count ≥ non-Bad count
 */
export function checkWinCondition(
  game: Game,
  deadPlayerIds: string[],
): { type: GameStatus.Finished; winner: string } | undefined {
  const deadSet = new Set(deadPlayerIds);
  const aliveAssignments = game.roleAssignments.filter(
    (a) => !deadSet.has(a.playerId),
  );

  let badAlive = 0;
  let goodAlive = 0;
  let chupacabraAlive = false;

  const rolesLookup = WEREWOLF_ROLES as Record<
    string,
    (typeof WEREWOLF_ROLES)[WerewolfRole] | undefined
  >;
  for (const assignment of aliveAssignments) {
    const role = rolesLookup[assignment.roleDefinitionId];
    if (!role) continue;
    if (role.id === WerewolfRole.Chupacabra) {
      chupacabraAlive = true;
    } else if (role.team === Team.Bad) {
      badAlive++;
    } else if (role.team === Team.Good) {
      goodAlive++;
    }
  }

  if (badAlive === 0) {
    // Chupacabra wins if it's alive and only ≤1 Good player remains
    if (chupacabraAlive && goodAlive <= 1) {
      return { type: GameStatus.Finished, winner: WerewolfWinner.Chupacabra };
    }
    // Village wins only when no Bad and no Neutral players remain
    if (!chupacabraAlive) {
      return { type: GameStatus.Finished, winner: WerewolfWinner.Village };
    }
    // Chupacabra alive with >1 Good player remaining — game continues
    return undefined;
  }

  // Werewolves win if Bad count ≥ all non-Bad alive (Good + Chupacabra)
  const nonBadAlive = goodAlive + (chupacabraAlive ? 1 : 0);
  if (badAlive >= nonBadAlive) {
    return { type: GameStatus.Finished, winner: WerewolfWinner.Werewolves };
  }

  return undefined;
}

/** Canonical winner identifier strings for Werewolf win conditions. */
export const WerewolfWinner = {
  Werewolves: "Werewolves",
  Village: "Village",
  Chupacabra: "Chupacabra",
} as const;
export type WerewolfWinner =
  (typeof WerewolfWinner)[keyof typeof WerewolfWinner];
