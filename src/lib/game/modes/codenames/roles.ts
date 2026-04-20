import { Team } from "@/lib/types";
import type { RoleBucket, RoleDefinition } from "@/lib/types";

export enum CodenamesRole {
  BlueCodemaster = "codenames-blue-codemaster",
  BlueGuesser = "codenames-blue-guesser",
  RedCodemaster = "codenames-red-codemaster",
  RedGuesser = "codenames-red-guesser",
}

export const MIN_PLAYERS = 4;

/**
 * Default team assignment: two players per team, one Codemaster and one Guesser each.
 * Extra players are added as Guessers, distributed evenly across both teams.
 */
export function defaultRoleCount(numPlayers: number): RoleBucket[] {
  const n = Math.max(numPlayers, MIN_PLAYERS);
  const extraGuessers = n - MIN_PLAYERS;
  const redGuessers = 1 + Math.ceil(extraGuessers / 2);
  const blueGuessers = 1 + Math.floor(extraGuessers / 2);
  return [
    { playerCount: 1, roleId: CodenamesRole.RedCodemaster },
    { playerCount: redGuessers, roleId: CodenamesRole.RedGuesser },
    { playerCount: 1, roleId: CodenamesRole.BlueCodemaster },
    { playerCount: blueGuessers, roleId: CodenamesRole.BlueGuesser },
  ];
}

export const CODENAMES_ROLES: Record<
  CodenamesRole,
  RoleDefinition<CodenamesRole, Team>
> = {
  [CodenamesRole.BlueCodemaster]: {
    id: CodenamesRole.BlueCodemaster,
    name: "Blue Codemaster",
    team: Team.Bad,
    summary: "Gives one-word clues to guide the Blue team's guessers.",
    description:
      "The Blue Codemaster sees the full key card showing the color of every word on the board. Each turn they give a one-word clue and a number, directing their team's guessers to reveal Blue words without hitting Red words or the Assassin.",
    unique: true,
  },
  [CodenamesRole.BlueGuesser]: {
    id: CodenamesRole.BlueGuesser,
    name: "Blue Guesser",
    team: Team.Bad,
    summary: "Guesses words based on the Blue Codemaster's clues.",
    description:
      "The Blue Guesser listens to the Codemaster's clue and number, then selects words on the board they believe are Blue. They only see words that have already been revealed; the colors of unrevealed words remain hidden.",
  },
  [CodenamesRole.RedCodemaster]: {
    id: CodenamesRole.RedCodemaster,
    name: "Red Codemaster",
    team: Team.Good,
    summary: "Gives one-word clues to guide the Red team's guessers.",
    description:
      "The Red Codemaster sees the full key card showing the color of every word on the board. Each turn they give a one-word clue and a number, directing their team's guessers to reveal Red words without hitting Blue words or the Assassin.",
    unique: true,
  },
  [CodenamesRole.RedGuesser]: {
    id: CodenamesRole.RedGuesser,
    name: "Red Guesser",
    team: Team.Good,
    summary: "Guesses words based on the Red Codemaster's clues.",
    description:
      "The Red Guesser listens to the Codemaster's clue and number, then selects words on the board they believe are Red. They only see words that have already been revealed; the colors of unrevealed words remain hidden.",
  },
};

/** Returns true if the given string is a known CodenamesRole. */
export function isCodenamesRole(id: string): id is CodenamesRole {
  return id in CODENAMES_ROLES;
}

/** Look up a CodenamesRole definition by string ID, returning undefined if not found. */
export function getCodenamesRole(
  id: string,
): RoleDefinition<CodenamesRole, Team> | undefined {
  if (!isCodenamesRole(id)) return undefined;
  return CODENAMES_ROLES[id];
}
