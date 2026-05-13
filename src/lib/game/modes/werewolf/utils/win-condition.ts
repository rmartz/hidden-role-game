import { GameStatus, Team } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfRole, getWerewolfRole } from "../roles";
import { currentTurnState } from "./game-state";

/**
 * Checks the current win condition for a Werewolf game.
 * Returns a Finished status with the winner if a win condition is met,
 * or undefined if the game should continue.
 *
 * When badAlive === 0:
 * 1. Chupacabra/Arsonist wins: exactly one neutral killer alive (Chupacabra or Arsonist)
 *    with ≤1 Good player alive
 * 2. Draw: no Bad, no Neutral, no Good players alive (everyone eliminated simultaneously)
 * 3. Village wins: no Bad and no Neutral players remain
 *    (Chupacabra/Arsonist still alive with >1 Good → game continues)
 *
 * When badAlive > 0:
 * 4. Game continues if only neutral killers remain as opposition (goodAlive === 0):
 *    their win conditions conflict and will resolve through night kills
 * 5. Werewolves win: Bad team count ≥ non-Bad count (Good + Neutral + Chupacabra + Arsonist)
 *
 * Zombie wins are checked before standard conditions:
 * - Zombie wins: infected alive > healthy alive (checked after every death)
 * Note: Dracula win is checked separately in startNightAction, not here.
 */
export function checkWinCondition(
  game: Game,
  deadPlayerIds: string[],
):
  | {
      type: GameStatus.Finished;
      winner: WerewolfWinner;
      victoryConditionKey?: string;
    }
  | undefined {
  const deadSet = new Set(deadPlayerIds);
  const aliveAssignments = game.roleAssignments.filter(
    (a) => !deadSet.has(a.playerId),
  );

  const ts = currentTurnState(game);

  // Zombie wins if infected alive > healthy alive (Zombie itself is excluded).
  const zombieAssignment = game.roleAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.Zombie as string),
  );
  if (
    zombieAssignment &&
    !deadSet.has(zombieAssignment.playerId) &&
    ts?.zombieInfected?.length
  ) {
    const infectedSet = new Set(ts.zombieInfected);
    const infectedAlive = aliveAssignments.filter((a) =>
      infectedSet.has(a.playerId),
    ).length;
    const healthyAlive = aliveAssignments.filter(
      (a) =>
        !infectedSet.has(a.playerId) &&
        a.playerId !== zombieAssignment.playerId,
    ).length;
    if (infectedAlive > healthyAlive) {
      return withMercenaryCoWin(
        { type: GameStatus.Finished, winner: WerewolfWinner.Zombie },
        game,
        deadPlayerIds,
      );
    }
  }

  let badAlive = 0;
  let regularBadAlive = 0;
  let loneWolfAlive = 0;
  let goodAlive = 0;
  let neutralAlive = 0;
  let chupacabraAlive = false;
  let arsonistAlive = false;
  let spoilerAlive = false;
  let illuminatiAlive = false;

  for (const assignment of aliveAssignments) {
    const role = getWerewolfRole(assignment.roleDefinitionId);
    if (!role) continue;
    if (role.id === WerewolfRole.Chupacabra) {
      chupacabraAlive = true;
    } else if (role.id === WerewolfRole.Arsonist) {
      arsonistAlive = true;
    } else if (role.id === WerewolfRole.Spoiler) {
      spoilerAlive = true;
    } else if (role.id === WerewolfRole.Illuminati) {
      illuminatiAlive = true;
      neutralAlive++;
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
      // Remaining neutral roles (Tanner, Executioner, Dracula, Zombie) oppose wolves
      neutralAlive++;
    }
  }

  // Count neutral killers: Chupacabra and Arsonist have the same win-condition structure.
  const killerNeutralsAlive =
    (chupacabraAlive ? 1 : 0) + (arsonistAlive ? 1 : 0);

  let winResult:
    | { type: GameStatus.Finished; winner: WerewolfWinner }
    | undefined;

  if (badAlive === 0) {
    if (killerNeutralsAlive === 1) {
      // Exactly one neutral killer alive: they win if ≤1 Good player remains.
      if (goodAlive <= 1) {
        winResult = {
          type: GameStatus.Finished,
          winner: chupacabraAlive
            ? WerewolfWinner.Chupacabra
            : WerewolfWinner.Arsonist,
        };
      }
      // neutral killer alive with >1 Good player remaining — game continues
    } else if (killerNeutralsAlive >= 2) {
      // Both Chupacabra and Arsonist alive — they oppose each other, game continues
    } else {
      // No neutral killers alive
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
    // Bad players still alive but only neutral killers remain as opposition:
    // their win conditions conflict and will resolve through night kills — game continues
    if (!(killerNeutralsAlive > 0 && goodAlive === 0 && neutralAlive === 0)) {
      const nonBadAlive = goodAlive + neutralAlive + killerNeutralsAlive;

      // Lone Wolf wins: fires before general Werewolf win check.
      // When all remaining Bad are Lone Wolves and they match/outnumber non-Bad.
      if (regularBadAlive === 0 && loneWolfAlive >= nonBadAlive) {
        winResult = {
          type: GameStatus.Finished,
          winner: WerewolfWinner.LoneWolf,
        };
      } else if (badAlive >= nonBadAlive) {
        // Werewolves win if Bad count ≥ all non-Bad alive (Good + Neutral + neutral killers)
        winResult = {
          type: GameStatus.Finished,
          winner: WerewolfWinner.Werewolves,
        };
      }
    }
  }

  // Illuminati override: if any win condition fires, the Illuminati is alive,
  // and ≤ 3 total players remain, the Illuminati wins instead (takes priority over Spoiler).
  if (winResult && illuminatiAlive && aliveAssignments.length <= 3) {
    winResult = {
      type: GameStatus.Finished,
      winner: WerewolfWinner.Illuminati,
    };
  }
  // Spoiler override: if a standard win condition is met and the Spoiler is alive,
  // the Spoiler wins instead (lower priority than Illuminati).
  else if (winResult && spoilerAlive) {
    winResult = { type: GameStatus.Finished, winner: WerewolfWinner.Spoiler };
  }

  // Mercenary co-win: if any win fires, the Mercenary is alive, and at least
  // one bribed player is alive on the winning side, the Mercenary also wins
  // (shown alongside the main winner, lower priority than Illuminati and Spoiler).
  if (winResult) {
    return withMercenaryCoWin(winResult, game, deadPlayerIds);
  }

  return winResult;
}

/**
 * Augments a win result with a Mercenary co-win (`victoryConditionKey`) if the
 * Mercenary is alive and at least one bribed player is alive on the winning side.
 * Returns the original result unchanged if the Mercenary co-win does not apply.
 */
export function withMercenaryCoWin(
  result: { type: GameStatus.Finished; winner: WerewolfWinner },
  game: Game,
  deadPlayerIds: string[],
): {
  type: GameStatus.Finished;
  winner: WerewolfWinner;
  victoryConditionKey?: string;
} {
  const deadSet = new Set(deadPlayerIds);
  const ts = currentTurnState(game);
  const mercenaryAssignment = game.roleAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.Mercenary as string),
  );
  if (mercenaryAssignment && !deadSet.has(mercenaryAssignment.playerId)) {
    const bribedPlayerIds = ts?.mercenaryBribedPlayerIds ?? [];
    const mercenaryWins = bribedPlayerIds.some((bribedId) =>
      isBribedPlayerOnWinningSide(bribedId, deadSet, game, result.winner),
    );
    if (mercenaryWins) {
      return { ...result, victoryConditionKey: WerewolfWinner.Mercenary };
    }
  }
  return result;
}

export const WerewolfWinner = {
  Arsonist: "Arsonist",
  Werewolves: "Werewolves",
  Village: "Village",
  Chupacabra: "Chupacabra",
  Dracula: "Dracula",
  Draw: "Draw",
  Illuminati: "Illuminati",
  LoneWolf: "LoneWolf",
  Mercenary: "Mercenary",
  Tanner: "Tanner",
  Spoiler: "Spoiler",
  Executioner: "Executioner",
  Zombie: "Zombie",
} as const;
export type WerewolfWinner =
  (typeof WerewolfWinner)[keyof typeof WerewolfWinner];

/**
 * Checks whether a bribed player is on the winning side for the given winner.
 * For team wins (Village, Werewolves), the bribed player must be alive
 * and on the winning team. For individual-role wins (Spoiler, Illuminati,
 * LoneWolf, Chupacabra, Executioner, Zombie, Dracula), the bribed player
 * must be alive and have that specific winning role.
 */
function isBribedPlayerOnWinningSide(
  bribedId: string,
  deadSet: Set<string>,
  game: Game,
  winner: string,
): boolean {
  if (deadSet.has(bribedId)) return false;
  const assignment = game.roleAssignments.find((a) => a.playerId === bribedId);
  if (!assignment) return false;

  if (winner === WerewolfWinner.Village) {
    const role = getWerewolfRole(assignment.roleDefinitionId);
    return role?.team === Team.Good;
  }
  if (winner === WerewolfWinner.Werewolves) {
    const role = getWerewolfRole(assignment.roleDefinitionId);
    return role?.team === Team.Bad;
  }

  // Individual-role wins: bribed player must be that specific winning role.
  const winnerToRole: Partial<Record<string, string>> = {
    [WerewolfWinner.Chupacabra]: WerewolfRole.Chupacabra,
    [WerewolfWinner.Dracula]: WerewolfRole.Dracula,
    [WerewolfWinner.Executioner]: WerewolfRole.Executioner,
    [WerewolfWinner.Illuminati]: WerewolfRole.Illuminati,
    [WerewolfWinner.LoneWolf]: WerewolfRole.LoneWolf,
    [WerewolfWinner.Spoiler]: WerewolfRole.Spoiler,
    [WerewolfWinner.Zombie]: WerewolfRole.Zombie,
  };
  const winningRoleId = winnerToRole[winner];
  if (!winningRoleId) return false;
  return assignment.roleDefinitionId === winningRoleId;
}
