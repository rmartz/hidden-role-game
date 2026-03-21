import type { TimerConfig, GameStatusState, Team } from "@/lib/types";
import { parseTimerConfig } from "./lobby";
import type { AnyNightAction, DaytimeVote } from "@/lib/game-modes/werewolf";
import type {
  PlayerGameState,
  RoleInPlay,
  VisibleTeammate,
  NightStatusEntry,
} from "@/server/types";
import type { FirebaseLobbyPlayer } from "./lobby";

export interface FirebasePlayerState {
  statusJson: string; // JSON.stringify(GameStatusState)
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
  nightActions?: Record<string, AnyNightAction>;
  myNightTarget?: string;
  /** True when the player has intentionally chosen to skip their night action. */
  myNightTargetSkipped?: boolean;
  myNightTargetConfirmed?: boolean;
  teamVotes?: (
    | { playerName: string; targetPlayerId: string }
    | { playerName: string; skipped: true }
  )[];
  suggestedTargetId?: string;
  allAgreed?: boolean;
  amDead?: boolean;
  deadPlayerIds?: string[];
  nightStatus?: NightStatusEntry[];
  previousNightTargetId?: string;
  investigationResult?: { targetPlayerId: string; isWerewolfTeam: boolean };
  witchAbilityUsed?: boolean;
  morticianAbilityEnded?: boolean;
  priestWardActive?: boolean;
  timerConfig: TimerConfig;
  isSilenced?: boolean;
  isHypnotized?: boolean;
  activeTrial?: {
    defendantId: string;
    startedAt: number;
    phase: string;
    voteStartedAt?: number;
    myVote?: DaytimeVote;
    voteCount: number;
    playerCount: number;
    verdict?: "eliminated" | "innocent";
    mustVoteGuilty?: boolean;
    mustVoteInnocent?: boolean;
    voteResults?: { playerName: string; vote: DaytimeVote }[];
    eliminatedRole?: { id: string; name: string; team: string };
  };
  nominationsEnabled?: boolean;
  singleTrialPerDay?: boolean;
  executionerTargetId?: string;
  nominations?: { defendantId: string; nominatorIds: string[] }[];
  myNominatedDefendantId?: string;
}

export function playerStateToFirebase(
  state: PlayerGameState,
): FirebasePlayerState {
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
    ...(state.nightActions ? { nightActions: state.nightActions } : {}),
    ...(state.myNightTarget !== undefined
      ? state.myNightTarget === null
        ? { myNightTargetSkipped: true }
        : { myNightTarget: state.myNightTarget }
      : {}),
    ...(state.myNightTargetConfirmed !== undefined
      ? { myNightTargetConfirmed: state.myNightTargetConfirmed }
      : {}),
    ...(state.teamVotes?.length ? { teamVotes: state.teamVotes } : {}),
    ...(state.suggestedTargetId !== undefined
      ? { suggestedTargetId: state.suggestedTargetId }
      : {}),
    ...(state.allAgreed !== undefined ? { allAgreed: state.allAgreed } : {}),
    ...(state.amDead ? { amDead: true } : {}),
    ...(state.deadPlayerIds?.length
      ? { deadPlayerIds: state.deadPlayerIds }
      : {}),
    ...(state.nightStatus?.length ? { nightStatus: state.nightStatus } : {}),
    ...(state.previousNightTargetId
      ? { previousNightTargetId: state.previousNightTargetId }
      : {}),
    ...(state.investigationResult
      ? { investigationResult: state.investigationResult }
      : {}),
    ...(state.witchAbilityUsed ? { witchAbilityUsed: true } : {}),
    ...(state.morticianAbilityEnded ? { morticianAbilityEnded: true } : {}),
    ...(state.priestWardActive ? { priestWardActive: true } : {}),
    timerConfig: state.timerConfig,
    ...(state.isSilenced ? { isSilenced: true } : {}),
    ...(state.isHypnotized ? { isHypnotized: true } : {}),
    ...(state.activeTrial ? { activeTrial: state.activeTrial } : {}),
    nominationsEnabled: state.nominationsEnabled,
    singleTrialPerDay: state.singleTrialPerDay,
    ...(state.executionerTargetId
      ? { executionerTargetId: state.executionerTargetId }
      : {}),
    ...(state.nominations?.length ? { nominations: state.nominations } : {}),
    ...(state.myNominatedDefendantId
      ? { myNominatedDefendantId: state.myNominatedDefendantId }
      : {}),
  };
}

export function firebaseToPlayerState(
  raw: FirebasePlayerState,
): PlayerGameState {
  return {
    status: JSON.parse(raw.statusJson) as GameStatusState,
    gameMode: raw.gameMode as PlayerGameState["gameMode"],
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
    ...(raw.nightActions ? { nightActions: raw.nightActions } : {}),
    ...(raw.myNightTargetSkipped
      ? { myNightTarget: null }
      : raw.myNightTarget !== undefined
        ? { myNightTarget: raw.myNightTarget }
        : {}),
    ...(raw.myNightTargetConfirmed !== undefined
      ? { myNightTargetConfirmed: raw.myNightTargetConfirmed }
      : {}),
    ...(raw.teamVotes?.length ? { teamVotes: raw.teamVotes } : {}),
    ...(raw.suggestedTargetId !== undefined
      ? { suggestedTargetId: raw.suggestedTargetId }
      : {}),
    ...(raw.allAgreed !== undefined ? { allAgreed: raw.allAgreed } : {}),
    ...(raw.amDead ? { amDead: true } : {}),
    ...(raw.deadPlayerIds?.length ? { deadPlayerIds: raw.deadPlayerIds } : {}),
    ...(raw.nightStatus?.length ? { nightStatus: raw.nightStatus } : {}),
    ...(raw.previousNightTargetId
      ? { previousNightTargetId: raw.previousNightTargetId }
      : {}),
    ...(raw.investigationResult
      ? { investigationResult: raw.investigationResult }
      : {}),
    ...(raw.witchAbilityUsed ? { witchAbilityUsed: true } : {}),
    ...(raw.morticianAbilityEnded ? { morticianAbilityEnded: true } : {}),
    ...(raw.priestWardActive ? { priestWardActive: true } : {}),
    // The TypeScript type says TimerConfig, but old Firebase documents may
    // have partial data (e.g. missing autoAdvance). Cast to raw Record so
    // parseTimerConfig validates each field and fills defaults, rather than
    // blindly trusting the cast value.
    timerConfig: parseTimerConfig(
      raw.timerConfig as unknown as Record<string, unknown>,
    ),
    ...(raw.isSilenced ? { isSilenced: true } : {}),
    ...(raw.isHypnotized ? { isHypnotized: true } : {}),
    ...(raw.activeTrial
      ? {
          activeTrial: raw.activeTrial as PlayerGameState["activeTrial"],
        }
      : {}),
    nominationsEnabled: raw.nominationsEnabled ?? false,
    singleTrialPerDay: raw.singleTrialPerDay ?? false,
    ...(raw.executionerTargetId
      ? { executionerTargetId: raw.executionerTargetId }
      : {}),
    ...(raw.nominations?.length ? { nominations: raw.nominations } : {}),
    ...(raw.myNominatedDefendantId
      ? { myNominatedDefendantId: raw.myNominatedDefendantId }
      : {}),
  };
}
