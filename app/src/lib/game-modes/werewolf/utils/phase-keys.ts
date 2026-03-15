import { Team } from "@/lib/types";

export const TEAM_PHASE_PREFIX = "team:";

export function isTeamPhaseKey(key: string): boolean {
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
