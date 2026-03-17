import { GameStatus, Team } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfRole, WEREWOLF_ROLES } from "../roles";

/**
 * Checks the current win condition for a Werewolf game.
 * Returns a Finished status with the winner if a win condition is met,
 * or undefined if the game should continue.
 *
 * When badAlive === 0:
 * 1. Chupacabra wins: Chupacabra alive, ≤1 Good player alive
 * 2. Draw: no Bad, no Neutral, no Good players alive (everyone eliminated simultaneously)
 * 3. Village wins: no Bad and no Neutral players remain
 *    (Chupacabra still alive with >1 Good → game continues)
 *
 * When badAlive > 0:
 * 4. Game continues if Chupacabra is the only remaining opposition (goodAlive === 0):
 *    their win conditions conflict and will resolve through night kills
 * 5. Werewolves win: Bad team count ≥ non-Bad count (Good + Chupacabra)
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
    if (chupacabraAlive) {
      // Chupacabra wins if it's alive and only ≤1 Good player remains
      if (goodAlive <= 1) {
        return { type: GameStatus.Finished, winner: WerewolfWinner.Chupacabra };
      }
      // Chupacabra alive with >1 Good player remaining — game continues
      return undefined;
    }
    // No Bad, no Neutral — draw if no Good remain either (simultaneous eliminations)
    if (goodAlive === 0) {
      return { type: GameStatus.Finished, winner: WerewolfWinner.Draw };
    }
    // Village wins: no Bad and no Neutral remain
    return { type: GameStatus.Finished, winner: WerewolfWinner.Village };
  }

  // Bad players still alive but only Chupacabra remains as opposition:
  // their win conditions conflict and will resolve through night kills — game continues
  if (chupacabraAlive && goodAlive === 0) {
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
  Draw: "Draw",
} as const;
export type WerewolfWinner =
  (typeof WerewolfWinner)[keyof typeof WerewolfWinner];
