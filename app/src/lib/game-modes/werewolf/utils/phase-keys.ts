import { Team } from "@/lib/types";

export const TEAM_PHASE_PREFIX = "team:";

export function isTeamPhaseKey(key: string): boolean {
  return key.startsWith(TEAM_PHASE_PREFIX);
}

export function parseTeamPhaseKey(key: string): Team | null {
  if (!isTeamPhaseKey(key)) return null;
  const teamStr = key.slice(TEAM_PHASE_PREFIX.length);
  if (Object.values(Team).includes(teamStr as Team)) return teamStr as Team;
  return null;
}

export function getTeamPhaseKey(team: Team): string {
  return `${TEAM_PHASE_PREFIX}${team}`;
}
