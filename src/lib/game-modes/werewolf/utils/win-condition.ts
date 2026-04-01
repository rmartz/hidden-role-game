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
 * 5. Werewolves win: Bad team count ≥ non-Bad count (Good + Neutral + Chupacabra)
 */
export function checkWinCondition(
  game: Game,
  deadPlayerIds: string[],
): { type: GameStatus.Finished; winner: WerewolfWinner } | undefined {
  const deadSet = new Set(deadPlayerIds);
  const aliveAssignments = game.roleAssignments.filter(
    (a) => !deadSet.has(a.playerId),
  );

  let badAlive = 0;
  let regularBadAlive = 0;
  let loneWolfAlive = 0;
  let goodAlive = 0;
  let neutralAlive = 0;
  let chupacabraAlive = false;
  let spoilerAlive = false;

  const rolesLookup = WEREWOLF_ROLES as Record<
    string,
    (typeof WEREWOLF_ROLES)[WerewolfRole] | undefined
  >;
  for (const assignment of aliveAssignments) {
    const role = rolesLookup[assignment.roleDefinitionId];
    if (!role) continue;
    if (role.id === WerewolfRole.Chupacabra) {
      chupacabraAlive = true;
    } else if (role.id === WerewolfRole.Spoiler) {
      spoilerAlive = true;
    } else if (role.id === WerewolfRole.LoneWolf) {
      // Lone Wolf is Team.Neutral but wolf-aligned for win condition purposes
      badAlive++;
      loneWolfAlive++;
    } else if (role.team === Team.Bad) {
      badAlive++;
      regularBadAlive++;
    } else if (role.team === Team.Good) {
      goodAlive++;
    } else {
      // Remaining neutral roles (Tanner, Executioner) oppose wolves
      neutralAlive++;
    }
  }

  let winResult:
    | { type: GameStatus.Finished; winner: WerewolfWinner }
    | undefined;

  if (badAlive === 0) {
    if (chupacabraAlive) {
      // Chupacabra wins if it's alive and only ≤1 Good player remains
      if (goodAlive <= 1) {
        winResult = {
          type: GameStatus.Finished,
          winner: WerewolfWinner.Chupacabra,
        };
      }
      // Chupacabra alive with >1 Good player remaining — game continues
    } else {
      // Draw if nobody remains (simultaneous eliminations)
      if (goodAlive === 0 && neutralAlive === 0) {
        winResult = { type: GameStatus.Finished, winner: WerewolfWinner.Draw };
      } else {
        // Village wins: no Bad and no Neutral remain
        winResult = {
          type: GameStatus.Finished,
          winner: WerewolfWinner.Village,
        };
      }
    }
  } else {
    // Bad players still alive but only Chupacabra remains as opposition:
    // their win conditions conflict and will resolve through night kills — game continues
    if (!(chupacabraAlive && goodAlive === 0 && neutralAlive === 0)) {
      const nonBadAlive = goodAlive + neutralAlive + (chupacabraAlive ? 1 : 0);

      // Lone Wolf wins: fires before general Werewolf win check.
      // When all remaining Bad are Lone Wolves and they match/outnumber non-Bad.
      if (regularBadAlive === 0 && loneWolfAlive >= nonBadAlive) {
        winResult = {
          type: GameStatus.Finished,
          winner: WerewolfWinner.LoneWolf,
        };
      } else if (badAlive >= nonBadAlive) {
        // Werewolves win if Bad count ≥ all non-Bad alive (Good + Neutral + Chupacabra)
        winResult = {
          type: GameStatus.Finished,
          winner: WerewolfWinner.Werewolves,
        };
      }
    }
  }

  // Spoiler override: if a standard win condition is met and the Spoiler is alive,
  // the Spoiler wins instead.
  if (winResult && spoilerAlive) {
    return { type: GameStatus.Finished, winner: WerewolfWinner.Spoiler };
  }

  return winResult;
}

/** Canonical winner identifier strings for Werewolf win conditions. */
export const WerewolfWinner = {
  Werewolves: "Werewolves",
  Village: "Village",
  Chupacabra: "Chupacabra",
  Draw: "Draw",
  LoneWolf: "LoneWolf",
  Tanner: "Tanner",
  Spoiler: "Spoiler",
  Executioner: "Executioner",
} as const;
export type WerewolfWinner =
  (typeof WerewolfWinner)[keyof typeof WerewolfWinner];
