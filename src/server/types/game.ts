import type {
  GameStatusState,
  GameMode,
  RoleSlot,
  Team,
  TimerConfig,
} from "@/lib/types";
import type { SecretVillainPhase } from "@/lib/game-modes/secret-villain/types";
import type {
  SpecialActionType,
  ElectionVote,
} from "@/lib/game-modes/secret-villain/types";
import type { PublicLobbyPlayer } from "./lobby";

export type { RoleSlot };

export interface CreateGameRequest {
  lobbyId: string;
}

export interface PublicRoleInfo {
  id: string;
  name: string;
  team: Team;
}

export interface RoleInPlay {
  id: string;
  name: string;
  team: Team;
  /** Configured minimum count for this role. */
  min: number;
  /** Configured maximum count for this role. */
  max: number;
  /** Actual assigned count. Only present for RoleAndCount mode. */
  count?: number;
}

export type VisibilityReason = "wake-partner" | "aware-of" | "revealed";

export interface VisibleTeammate {
  player: PublicLobbyPlayer;
  reason: VisibilityReason;
  /** Only present when the exact role is known (e.g., dead player reveal by narrator). */
  role?: PublicRoleInfo;
}

/** Night effects visible during the daytime summary. */
export interface DaytimeNightStatusEntry {
  targetPlayerId: string;
  effect:
    | "killed"
    | "protected"
    | "silenced"
    | "hypnotized"
    | "smited"
    | "survived"
    | "peaceful"
    | "altruist-sacrifice";
  /** For altruist-sacrifice: the player who was saved. */
  savedPlayerId?: string;
}

/** Night effects visible to the Witch during their nighttime phase only. */
export interface NighttimeNightStatusEntry {
  targetPlayerId: string;
  effect: "attacked";
}

export type NightStatusEntry =
  | DaytimeNightStatusEntry
  | NighttimeNightStatusEntry;

export interface PlayerGameState {
  status: GameStatusState;
  gameMode: GameMode;
  /** The lobby this game was started from. Used for returning to the lobby after the game ends. */
  lobbyId: string;
  players: PublicLobbyPlayer[];
  gameOwner?: PublicLobbyPlayer;
  /** The current player's own player ID. Undefined for the narrator/owner. */
  myPlayerId?: string;
  myRole?: PublicRoleInfo;
  visibleRoleAssignments: VisibleTeammate[];
  rolesInPlay?: RoleInPlay[];
  /** Whether this player has been marked as dead/eliminated. */
  amDead?: boolean;
  /** Player IDs marked as dead/eliminated. */
  deadPlayerIds?: string[];
  /** Phase timer configuration. */
  timerConfig: TimerConfig;
  // --- Secret Villain fields ---

  /** Current Secret Villain phase info (type, presidentId, etc.). */
  svPhase?: {
    type: SecretVillainPhase;
    presidentId: string;
    chancellorNomineeId?: string;
    chancellorId?: string;
    actionType?: SpecialActionType;
  };
  /** Board state: Good and Bad cards played, failed election count. */
  svBoard?: {
    goodCardsPlayed: number;
    badCardsPlayed: number;
    failedElectionCount: number;
  };
  /** President's drawn cards, chancellor's remaining cards, or peeked cards. */
  policyCards?: {
    drawnCards?: string[];
    remainingCards?: string[];
    discardedCard?: string;
    peekedCards?: string[];
    vetoProposed?: boolean;
    vetoResponse?: boolean;
  };
  /** Veto proposal visible to the president. */
  vetoProposal?: {
    vetoProposed: boolean;
    vetoResponse?: boolean;
  };
  /** Eligible chancellor IDs (president only, nomination phase). */
  eligibleChancellorIds?: string[];
  /** The player's own election vote (during or after voting). */
  myElectionVote?: ElectionVote;
  /** All election votes (after resolution). */
  electionVotes?: { playerId: string; vote: ElectionVote }[];
  /** Whether the election passed. */
  electionPassed?: boolean;
  /** Whether veto power is unlocked (4+ Bad cards). */
  vetoUnlocked?: boolean;
  /** Secret Villain investigation result (president only). */
  svInvestigationResult?: {
    targetPlayerId: string;
    team: string;
  };
  /** True when this player is the investigation target and needs to consent. */
  svInvestigationConsent?: boolean;
  /** Player ID the president is waiting on for investigation consent. */
  svInvestigationWaitingForPlayerId?: string;
}
