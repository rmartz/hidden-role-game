import { GameStatus, Team } from "@/lib/types";
import type { Game, PlayerRoleAssignment } from "@/lib/types";
import { WakesAtNight, TargetCategory, WerewolfPhase } from "./types";
import type {
  TargetablePlayer,
  TeamNightVote,
  WerewolfNighttimePhase,
  WerewolfTurnState,
} from "./types";
import { WEREWOLF_ROLES } from "./roles";
import type { WerewolfRoleDefinition } from "./roles";

const TEAM_PHASE_PREFIX = "team:";

// ---------------------------------------------------------------------------
// Team phase key helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Targetable players
// ---------------------------------------------------------------------------

/**
 * Returns the list of players eligible to be targeted during a night phase.
 * Excludes the game owner (narrator), dead players, the acting player
 * (`myPlayerId`), and phase-specific exclusions derived from
 * `visibleRoleAssignments`:
 *   - Team phase: all players on the active team are excluded.
 *   - Solo phase: the player(s) assigned to the active role are excluded.
 *
 * Pass `myPlayerId = null` for the narrator view (the narrator is already
 * absent from the players list).
 * Pass `activePhaseKey = ""` and `visibleRoleAssignments = []` when no
 * phase-aware exclusion is needed (e.g. in tests).
 */
export function getTargetablePlayers(
  players: TargetablePlayer[],
  ownerPlayerId: string | undefined,
  deadPlayerIds: string[],
  activePhaseKey: string,
  myPlayerId: string | null,
  visibleRoleAssignments: {
    player: { id: string };
    role: { id: string; team: string };
  }[],
): TargetablePlayer[] {
  const excludeIds: string[] = [];
  if (myPlayerId) excludeIds.push(myPlayerId);

  if (isTeamPhaseKey(activePhaseKey)) {
    const team = parseTeamPhaseKey(activePhaseKey);
    if (team) {
      for (const a of visibleRoleAssignments) {
        if ((a.role.team as Team) === team) excludeIds.push(a.player.id);
      }
    }
  } else {
    for (const a of visibleRoleAssignments) {
      if (a.role.id === activePhaseKey) excludeIds.push(a.player.id);
    }
  }

  return players.filter((p) => {
    if (p.id === ownerPlayerId) return false;
    if (deadPlayerIds.includes(p.id)) return false;
    if (excludeIds.includes(p.id)) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Night phase order
// ---------------------------------------------------------------------------

/**
 * Returns the ordered list of phase keys that wake during a Werewolf night.
 * Roles with `teamTargeting` on the same team are grouped into a single
 * team phase key (e.g. "team:Bad"). Solo roles use their role ID.
 */
export function buildNightPhaseOrder(
  turn: number,
  roleAssignments: PlayerRoleAssignment[],
): string[] {
  const assignedRoleIds = new Set(
    roleAssignments.map((a) => a.roleDefinitionId),
  );

  const phaseKeys: string[] = [];
  const emittedTeams = new Set<Team>();

  for (const role of Object.values(WEREWOLF_ROLES)) {
    if (!assignedRoleIds.has(role.id)) continue;
    if (role.wakesAtNight === WakesAtNight.Never) continue;
    if (role.wakesAtNight === WakesAtNight.FirstNightOnly && turn !== 1)
      continue;

    if (role.teamTargeting) {
      if (!emittedTeams.has(role.team)) {
        emittedTeams.add(role.team);
        phaseKeys.push(getTeamPhaseKey(role.team));
      }
    } else {
      phaseKeys.push(role.id);
    }
  }

  return phaseKeys;
}

// ---------------------------------------------------------------------------
// Team player helpers
// ---------------------------------------------------------------------------

/**
 * Returns the alive player IDs that belong to a team phase
 * (have `teamTargeting` and matching team).
 */
export function getTeamPlayerIds(
  roleAssignments: PlayerRoleAssignment[],
  team: Team,
  deadPlayerIds: string[],
): string[] {
  return roleAssignments
    .filter((a) => {
      const role = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
        a.roleDefinitionId
      ];
      return (
        role?.teamTargeting &&
        role.team === team &&
        !deadPlayerIds.includes(a.playerId)
      );
    })
    .map((a) => a.playerId);
}

/**
 * Returns all player IDs on the given team (alive or dead) so they can be
 * excluded from targeting. Includes any role on the team, not just
 * teamTargeting roles.
 */
export function getTeamMemberPlayerIds(
  roleAssignments: PlayerRoleAssignment[],
  team: Team,
): string[] {
  return roleAssignments
    .filter((a) => {
      const role = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
        a.roleDefinitionId
      ];
      return role?.team === team;
    })
    .map((a) => a.playerId);
}

/**
 * Returns the most-voted target from a list of team votes.
 * Returns undefined if there are no votes or a tie for the top spot.
 */
export function computeSuggestedTarget(
  votes: TeamNightVote[],
): string | undefined {
  if (votes.length === 0) return undefined;

  const counts = new Map<string, number>();
  for (const v of votes) {
    counts.set(v.targetPlayerId, (counts.get(v.targetPlayerId) ?? 0) + 1);
  }

  let maxCount = 0;
  let maxTarget: string | undefined;
  let tied = false;

  for (const [target, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxTarget = target;
      tied = false;
    } else if (count === maxCount) {
      tied = true;
    }
  }

  return tied ? undefined : maxTarget;
}

// ---------------------------------------------------------------------------
// Game state helpers
// ---------------------------------------------------------------------------

export function isOwnerPlaying(game: Game, callerId: string): boolean {
  return (
    callerId === game.ownerPlayerId && game.status.type === GameStatus.Playing
  );
}

export function currentTurnState(game: Game): WerewolfTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as WerewolfTurnState | undefined;
}

export interface ActiveNightPlayer {
  phase: WerewolfNighttimePhase;
  activePhaseKey: string;
  isTeamPhase: boolean;
}

/**
 * Validates that the game is in a nighttime phase (after turn 1) and that the
 * caller belongs to the currently active night phase — either matching the
 * active role ID (solo) or belonging to the active team (team phase).
 * Returns the nighttime phase and active phase key on success, or undefined
 * if validation fails.
 */
export function validateActiveNightPlayer(
  game: Game,
  callerId: string,
): ActiveNightPlayer | undefined {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== WerewolfPhase.Nighttime) return undefined;
  if (ts.turn <= 1) return undefined;

  const phase = ts.phase;
  const callerAssignment = game.roleAssignments.find(
    (a) => a.playerId === callerId,
  );
  if (!callerAssignment) return undefined;

  const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
  if (!activePhaseKey) return undefined;

  const team = parseTeamPhaseKey(activePhaseKey);
  if (team) {
    // Team phase — check caller's role is on this team with teamTargeting.
    const callerRole = (
      WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>
    )[callerAssignment.roleDefinitionId];
    if (!callerRole?.teamTargeting || callerRole.team !== team)
      return undefined;
    return { phase, activePhaseKey, isTeamPhase: true };
  }

  // Solo phase — exact role match.
  if (callerAssignment.roleDefinitionId !== activePhaseKey) return undefined;
  return { phase, activePhaseKey, isTeamPhase: false };
}

/**
 * Returns the confirm button label for a given phase key based on its target category.
 * Team phase keys return "Attack". Solo roles: Attack, Protect, Investigate, or "Confirm".
 */
export function getConfirmLabel(phaseKey: string | undefined): string {
  if (!phaseKey) return "Confirm";
  if (isTeamPhaseKey(phaseKey)) return "Attack";
  const roleDef = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
    phaseKey
  ];
  if (!roleDef) return "Confirm";
  switch (roleDef.targetCategory) {
    case TargetCategory.Attack:
      return "Attack";
    case TargetCategory.Protect:
      return "Protect";
    case TargetCategory.Investigate:
      return "Investigate";
    default:
      return "Confirm";
  }
}
