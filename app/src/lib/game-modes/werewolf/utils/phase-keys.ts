import { Team } from "@/lib/types";
import type { WerewolfRole } from "../roles";

export const TEAM_PHASE_PREFIX = "team:";

/** A valid night phase key: either a solo role ID or a team phase key. */
export type PhaseKey = WerewolfRole | `team:${string}`;

export function isTeamPhaseKey(key: string): key is `team:${string}` {
  return key.startsWith(TEAM_PHASE_PREFIX);
}

export function parseTeamPhaseKey(key: string): Team | undefined {
  if (!isTeamPhaseKey(key)) return undefined;
  const teamStr = key.slice(TEAM_PHASE_PREFIX.length);
  if (Object.values(Team).includes(teamStr as Team)) return teamStr as Team;
  return undefined;
}

export function getTeamPhaseKey(team: Team): string {
  return `${TEAM_PHASE_PREFIX}${team}`;
}
