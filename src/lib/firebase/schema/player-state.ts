import type { TimerConfig, GameStatusState, Team } from "@/lib/types";
import { GameMode } from "@/lib/types";
import { parseTimerConfig } from "./lobby";
import type { AnyNightAction, DaytimeVote } from "@/lib/game/modes/werewolf";
import type {
  PlayerGameState,
  RoleInPlay,
  VisibleTeammate,
  NightStatusEntry,
} from "@/server/types";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";
import type { AvalonPlayerGameState } from "@/lib/game/modes/avalon/player-state";
import type { FirebaseLobbyPlayer } from "./lobby";

// ---------------------------------------------------------------------------
// Base Firebase player state interface (shared across all game modes)
// ---------------------------------------------------------------------------

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
}

// ---------------------------------------------------------------------------
// Werewolf-specific Firebase player state
// ---------------------------------------------------------------------------

export interface FirebaseWerewolfPlayerState extends FirebaseBasePlayerState {
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
  nightStatus?: NightStatusEntry[];
  previousNightTargetId?: string;
  investigationResult?: { targetPlayerId: string; isWerewolfTeam: boolean };
  witchAbilityUsed?: boolean;
  morticianAbilityEnded?: boolean;
  priestWardActive?: boolean;
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
  revealProtections?: boolean;
  executionerTargetId?: string;
  nominations?: { defendantId: string; nominatorIds: string[] }[];
  myNominatedDefendantId?: string;
  mirrorcasterCharged?: boolean;
  oneEyedSeerLockedTargetId?: string;
  elusiveSeerVillagerIds?: string[];
  exposerReveal?: { playerName: string; roleName: string; team: string };
  mySecondNightTarget?: string;
  exposerAbilityUsed?: boolean;
  hunterRevengePlayerId?: string;
  altruistSave?: { savedPlayerId: string; altruistPlayerId: string };
}

// ---------------------------------------------------------------------------
// Secret Villain-specific Firebase player state
// ---------------------------------------------------------------------------

export interface FirebaseSecretVillainPlayerState extends FirebaseBasePlayerState {
  /** SvTheme enum value stored as string. */
  svTheme?: string;
  /** JSON-serialized SvPhaseInfo. */
  svPhase?: string;
  /** JSON-serialized SvBoardState. */
  svBoard?: string;
  /** JSON-serialized SvPolicyCardsState. */
  policyCards?: string;
  /** JSON-serialized SvVetoProposalState. */
  vetoProposal?: string;
  eligibleChancellorIds?: string[];
  /** ElectionVote enum value stored as string. */
  myElectionVote?: string;
  /** JSON-serialized SvElectionVoteEntry[]. */
  electionVotes?: string;
  electionVoteCount?: number;
  votedPlayerIds?: string[];
  electionPassed?: boolean;
  vetoUnlocked?: boolean;
  /** JSON-serialized SvInvestigationResult. */
  svInvestigationResult?: string;
  svInvestigationConsent?: boolean;
  svInvestigationWaitingForPlayerId?: string;
}

// ---------------------------------------------------------------------------
// Avalon — base fields only
// ---------------------------------------------------------------------------

export type FirebaseAvalonPlayerState = FirebaseBasePlayerState;

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export type FirebasePlayerState =
  | FirebaseWerewolfPlayerState
  | FirebaseSecretVillainPlayerState
  | FirebaseAvalonPlayerState;

// ---------------------------------------------------------------------------
// Shared base serialization helpers
// ---------------------------------------------------------------------------

function baseStateToFirebase(state: PlayerGameState): FirebaseBasePlayerState {
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
  };
}

function baseStateFromFirebase(raw: FirebaseBasePlayerState): {
  status: GameStatusState;
  gameMode: string;
  lobbyId: string;
  players: FirebaseLobbyPlayer[];
  gameOwner: FirebaseLobbyPlayer | undefined;
  myPlayerId: string | undefined;
  myRole: { id: string; name: string; team: Team } | undefined;
  visibleRoleAssignments: VisibleTeammate[];
  rolesInPlay: RoleInPlay[] | undefined;
  amDead: true | undefined;
  deadPlayerIds: string[] | undefined;
  timerConfig: TimerConfig;
} {
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
    // The TypeScript type says TimerConfig, but old Firebase documents may
    // have partial data (e.g. missing autoAdvance). Cast to raw Record so
    // parseTimerConfig validates each field and fills defaults, rather than
    // blindly trusting the cast value.
    timerConfig: parseTimerConfig(
      raw.timerConfig as unknown as Record<string, unknown>,
    ),
  };
}

// ---------------------------------------------------------------------------
// Werewolf serializer / deserializer
// ---------------------------------------------------------------------------

function werewolfStateToFirebase(
  state: WerewolfPlayerGameState,
): FirebaseWerewolfPlayerState {
  return {
    ...baseStateToFirebase(state),
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
    ...(state.isSilenced ? { isSilenced: true } : {}),
    ...(state.isHypnotized ? { isHypnotized: true } : {}),
    ...(state.activeTrial ? { activeTrial: state.activeTrial } : {}),
    nominationsEnabled: state.nominationsEnabled,
    singleTrialPerDay: state.singleTrialPerDay,
    revealProtections: state.revealProtections,
    ...(state.executionerTargetId
      ? { executionerTargetId: state.executionerTargetId }
      : {}),
    ...(state.nominations?.length ? { nominations: state.nominations } : {}),
    ...(state.myNominatedDefendantId
      ? { myNominatedDefendantId: state.myNominatedDefendantId }
      : {}),
    ...(state.mirrorcasterCharged ? { mirrorcasterCharged: true } : {}),
    ...(state.oneEyedSeerLockedTargetId
      ? { oneEyedSeerLockedTargetId: state.oneEyedSeerLockedTargetId }
      : {}),
    ...(state.elusiveSeerVillagerIds?.length
      ? { elusiveSeerVillagerIds: state.elusiveSeerVillagerIds }
      : {}),
    ...(state.exposerReveal ? { exposerReveal: state.exposerReveal } : {}),
    ...(state.mySecondNightTarget
      ? { mySecondNightTarget: state.mySecondNightTarget }
      : {}),
    ...(state.exposerAbilityUsed ? { exposerAbilityUsed: true } : {}),
    ...(state.hunterRevengePlayerId
      ? { hunterRevengePlayerId: state.hunterRevengePlayerId }
      : {}),
  };
}

function werewolfStateFromFirebase(
  raw: FirebaseWerewolfPlayerState,
): WerewolfPlayerGameState {
  return {
    ...baseStateFromFirebase(raw),
    gameMode: GameMode.Werewolf,
    nominationsEnabled: raw.nominationsEnabled ?? false,
    singleTrialPerDay: raw.singleTrialPerDay ?? false,
    revealProtections: raw.revealProtections ?? false,
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
    ...(raw.isSilenced ? { isSilenced: true } : {}),
    ...(raw.isHypnotized ? { isHypnotized: true } : {}),
    ...(raw.activeTrial
      ? {
          activeTrial:
            raw.activeTrial as WerewolfPlayerGameState["activeTrial"],
        }
      : {}),
    ...(raw.executionerTargetId
      ? { executionerTargetId: raw.executionerTargetId }
      : {}),
    ...(raw.nominations?.length ? { nominations: raw.nominations } : {}),
    ...(raw.myNominatedDefendantId
      ? { myNominatedDefendantId: raw.myNominatedDefendantId }
      : {}),
    ...(raw.mirrorcasterCharged ? { mirrorcasterCharged: true } : {}),
    ...(raw.oneEyedSeerLockedTargetId
      ? { oneEyedSeerLockedTargetId: raw.oneEyedSeerLockedTargetId }
      : {}),
    ...(raw.elusiveSeerVillagerIds?.length
      ? { elusiveSeerVillagerIds: raw.elusiveSeerVillagerIds }
      : {}),
    ...(raw.exposerReveal
      ? {
          exposerReveal: {
            ...raw.exposerReveal,
            team: raw.exposerReveal.team as Team,
          },
        }
      : {}),
    ...(raw.mySecondNightTarget
      ? { mySecondNightTarget: raw.mySecondNightTarget }
      : {}),
    ...(raw.exposerAbilityUsed ? { exposerAbilityUsed: true } : {}),
    ...(raw.hunterRevengePlayerId
      ? { hunterRevengePlayerId: raw.hunterRevengePlayerId }
      : {}),
  } as WerewolfPlayerGameState;
}

// ---------------------------------------------------------------------------
// Secret Villain serializer / deserializer
// ---------------------------------------------------------------------------

function secretVillainStateToFirebase(
  state: SecretVillainPlayerGameState,
): FirebaseSecretVillainPlayerState {
  return {
    ...baseStateToFirebase(state),
    ...(state.svTheme !== undefined ? { svTheme: state.svTheme } : {}),
    ...(state.svPhase !== undefined
      ? { svPhase: JSON.stringify(state.svPhase) }
      : {}),
    ...(state.svBoard !== undefined
      ? { svBoard: JSON.stringify(state.svBoard) }
      : {}),
    ...(state.policyCards !== undefined
      ? { policyCards: JSON.stringify(state.policyCards) }
      : {}),
    ...(state.vetoProposal !== undefined
      ? { vetoProposal: JSON.stringify(state.vetoProposal) }
      : {}),
    ...(state.eligibleChancellorIds?.length
      ? { eligibleChancellorIds: state.eligibleChancellorIds }
      : {}),
    ...(state.myElectionVote !== undefined
      ? { myElectionVote: state.myElectionVote }
      : {}),
    ...(state.electionVotes?.length
      ? { electionVotes: JSON.stringify(state.electionVotes) }
      : {}),
    ...(state.electionVoteCount !== undefined
      ? { electionVoteCount: state.electionVoteCount }
      : {}),
    ...(state.votedPlayerIds?.length
      ? { votedPlayerIds: state.votedPlayerIds }
      : {}),
    ...(state.electionPassed !== undefined
      ? { electionPassed: state.electionPassed }
      : {}),
    ...(state.vetoUnlocked !== undefined
      ? { vetoUnlocked: state.vetoUnlocked }
      : {}),
    ...(state.svInvestigationResult !== undefined
      ? {
          svInvestigationResult: JSON.stringify(state.svInvestigationResult),
        }
      : {}),
    ...(state.svInvestigationConsent !== undefined
      ? { svInvestigationConsent: state.svInvestigationConsent }
      : {}),
    ...(state.svInvestigationWaitingForPlayerId !== undefined
      ? {
          svInvestigationWaitingForPlayerId:
            state.svInvestigationWaitingForPlayerId,
        }
      : {}),
  };
}

function secretVillainStateFromFirebase(
  raw: FirebaseSecretVillainPlayerState,
): SecretVillainPlayerGameState {
  return {
    ...baseStateFromFirebase(raw),
    gameMode: GameMode.SecretVillain,
    ...(raw.svTheme !== undefined
      ? { svTheme: raw.svTheme as SecretVillainPlayerGameState["svTheme"] }
      : {}),
    ...(raw.svPhase !== undefined
      ? {
          svPhase: JSON.parse(
            raw.svPhase,
          ) as SecretVillainPlayerGameState["svPhase"],
        }
      : {}),
    ...(raw.svBoard !== undefined
      ? {
          svBoard: JSON.parse(
            raw.svBoard,
          ) as SecretVillainPlayerGameState["svBoard"],
        }
      : {}),
    ...(raw.policyCards !== undefined
      ? {
          policyCards: JSON.parse(
            raw.policyCards,
          ) as SecretVillainPlayerGameState["policyCards"],
        }
      : {}),
    ...(raw.vetoProposal !== undefined
      ? {
          vetoProposal: JSON.parse(
            raw.vetoProposal,
          ) as SecretVillainPlayerGameState["vetoProposal"],
        }
      : {}),
    ...(raw.eligibleChancellorIds?.length
      ? { eligibleChancellorIds: raw.eligibleChancellorIds }
      : {}),
    ...(raw.myElectionVote !== undefined
      ? {
          myElectionVote:
            raw.myElectionVote as SecretVillainPlayerGameState["myElectionVote"],
        }
      : {}),
    ...(raw.electionVotes !== undefined
      ? {
          electionVotes: JSON.parse(
            raw.electionVotes,
          ) as SecretVillainPlayerGameState["electionVotes"],
        }
      : {}),
    ...(raw.electionVoteCount !== undefined
      ? { electionVoteCount: raw.electionVoteCount }
      : {}),
    ...(raw.votedPlayerIds?.length
      ? { votedPlayerIds: raw.votedPlayerIds }
      : {}),
    ...(raw.electionPassed !== undefined
      ? { electionPassed: raw.electionPassed }
      : {}),
    ...(raw.vetoUnlocked !== undefined
      ? { vetoUnlocked: raw.vetoUnlocked }
      : {}),
    ...(raw.svInvestigationResult !== undefined
      ? {
          svInvestigationResult: JSON.parse(
            raw.svInvestigationResult,
          ) as SecretVillainPlayerGameState["svInvestigationResult"],
        }
      : {}),
    ...(raw.svInvestigationConsent !== undefined
      ? { svInvestigationConsent: raw.svInvestigationConsent }
      : {}),
    ...(raw.svInvestigationWaitingForPlayerId !== undefined
      ? {
          svInvestigationWaitingForPlayerId:
            raw.svInvestigationWaitingForPlayerId,
        }
      : {}),
  } as SecretVillainPlayerGameState;
}

// ---------------------------------------------------------------------------
// Avalon serializer / deserializer
// ---------------------------------------------------------------------------

function avalonStateToFirebase(
  state: AvalonPlayerGameState,
): FirebaseAvalonPlayerState {
  return baseStateToFirebase(state);
}

function avalonStateFromFirebase(
  raw: FirebaseAvalonPlayerState,
): AvalonPlayerGameState {
  return {
    ...baseStateFromFirebase(raw),
    gameMode: GameMode.Avalon,
  } as AvalonPlayerGameState;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function playerStateToFirebase(
  state: PlayerGameState,
): FirebasePlayerState {
  switch (state.gameMode) {
    case GameMode.Werewolf:
      return werewolfStateToFirebase(state);
    case GameMode.SecretVillain:
      return secretVillainStateToFirebase(state);
    case GameMode.Avalon:
      return avalonStateToFirebase(state);
  }
}

export function firebaseToPlayerState(
  raw: FirebasePlayerState,
): PlayerGameState {
  switch (raw.gameMode as GameMode) {
    case GameMode.Werewolf:
      return werewolfStateFromFirebase(raw as FirebaseWerewolfPlayerState);
    case GameMode.SecretVillain:
      return secretVillainStateFromFirebase(
        raw as FirebaseSecretVillainPlayerState,
      );
    case GameMode.Avalon:
      return avalonStateFromFirebase(raw);
    default:
      throw new Error(`Unknown game mode: ${raw.gameMode}`);
  }
}
