import type { TimerConfig, GameStatusState, Team } from "@/lib/types";
import { parseTimerConfig } from "../lobby";
import type {
  PlayerGameState,
  RoleInPlay,
  VisibleTeammate,
} from "@/server/types";
import type { FirebaseLobbyPlayer } from "../lobby";

export interface FirebaseBasePlayerState {
  statusJson: string;
  gameMode: string;
  lobbyId: string;
  players?: FirebaseLobbyPlayer[];
  gameOwner: FirebaseLobbyPlayer | null;
  myPlayerId: string | null;
  myRole: { id: string; name: string; team: string } | null;
  visibleRoleAssignments?: {
    player: FirebaseLobbyPlayer;
    reason: string;
    role?: { id: string; name: string; team: string };
  }[];
  rolesInPlay?: RoleInPlay[] | null;
  amDead?: boolean;
  deadPlayerIds?: string[];
  timerConfig: TimerConfig;
  victoryCondition?: { label: string; winner: string };
}

export function baseStateToFirebase(
  state: PlayerGameState,
): FirebaseBasePlayerState {
  return {
    statusJson: JSON.stringify(state.status),
    gameMode: state.gameMode,
    lobbyId: state.lobbyId,
    players: state.players,
    gameOwner: state.gameOwner ?? null,
    myPlayerId: state.myPlayerId ?? null,
    myRole: state.myRole ?? null,
    visibleRoleAssignments: state.visibleRoleAssignments,
    rolesInPlay: state.rolesInPlay ?? null,
    ...(state.amDead ? { amDead: true } : {}),
    ...(state.deadPlayerIds?.length
      ? { deadPlayerIds: state.deadPlayerIds }
      : {}),
    timerConfig: state.timerConfig,
    ...(state.victoryCondition
      ? { victoryCondition: state.victoryCondition }
      : {}),
  };
}

export function baseStateFromFirebase(raw: FirebaseBasePlayerState) {
  return {
    status: JSON.parse(raw.statusJson) as GameStatusState,
    gameMode: raw.gameMode,
    lobbyId: raw.lobbyId,
    players: raw.players ?? [],
    gameOwner: raw.gameOwner ?? undefined,
    myPlayerId: raw.myPlayerId ?? undefined,
    myRole: raw.myRole
      ? {
          id: raw.myRole.id,
          name: raw.myRole.name,
          team: raw.myRole.team as Team,
        }
      : undefined,
    visibleRoleAssignments: (raw.visibleRoleAssignments ?? []).map(
      (v): VisibleTeammate => ({
        player: v.player,
        reason: v.reason as VisibleTeammate["reason"],
        ...(v.role
          ? {
              role: {
                id: v.role.id,
                name: v.role.name,
                team: v.role.team as Team,
              },
            }
          : {}),
      }),
    ),
    rolesInPlay: raw.rolesInPlay ?? undefined,
    amDead: raw.amDead ? true : undefined,
    deadPlayerIds: raw.deadPlayerIds?.length ? raw.deadPlayerIds : undefined,
    victoryCondition: raw.victoryCondition
      ? {
          label: raw.victoryCondition.label,
          winner: raw.victoryCondition.winner as Team,
        }
      : undefined,
    // Old Firebase documents may have partial data (e.g. missing autoAdvance);
    // parseTimerConfig validates each field and fills defaults.
    timerConfig: parseTimerConfig(raw.timerConfig),
  };
}
