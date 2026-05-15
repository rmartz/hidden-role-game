import type { AnyNightAction, DaytimeVote } from "@/lib/game/modes/werewolf";
import { TrialVerdict } from "@/lib/game/modes/werewolf";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { GameMode } from "@/lib/types";
import type { NightStatusEntry } from "@/server/types";

import {
  baseStateFromFirebase,
  baseStateToFirebase,
  type FirebaseBasePlayerState,
} from "./base";
import {
  type FirebaseWerewolfRoleState,
  werewolfRoleStateFromFirebase,
  werewolfRoleStateToFirebase,
} from "./werewolf-roles";

// ---------------------------------------------------------------------------
// Werewolf-specific Firebase player state
// ---------------------------------------------------------------------------

export interface FirebaseWerewolfPlayerState
  extends FirebaseBasePlayerState, FirebaseWerewolfRoleState {
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
  activeTrial?: {
    defendantId: string;
    startedAt: number;
    phase: string;
    voteStartedAt?: number;
    pausedAt?: number;
    pauseOffset?: number;
    myVote?: DaytimeVote;
    voteCount: number;
    playerCount: number;
    verdict?: TrialVerdict;
    mustVoteGuilty?: boolean;
    mustVoteInnocent?: boolean;
    voteResults?: { playerName: string; vote: DaytimeVote }[];
    eliminatedRole?: { id: string; name: string; team: string };
    defendantEliminated?: boolean;
  };
  nominationsEnabled: boolean;
  trialsPerDay?: number;
  concludedTrialsCount?: number;
  revealProtections: boolean;
  autoRevealNightOutcome?: boolean;
  nominations?: { defendantId: string; nominatorIds: string[] }[];
  myNominatedDefendantId?: string;
  pendingGuiltId?: string;
}

// ---------------------------------------------------------------------------
// Werewolf serializer / deserializer
// ---------------------------------------------------------------------------

export function werewolfStateToFirebase(
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
    ...(state.activeTrial ? { activeTrial: state.activeTrial } : {}),
    nominationsEnabled: state.nominationsEnabled,
    ...(state.trialsPerDay !== undefined
      ? { trialsPerDay: state.trialsPerDay }
      : {}),
    ...(state.concludedTrialsCount
      ? { concludedTrialsCount: state.concludedTrialsCount }
      : {}),
    revealProtections: state.revealProtections,
    autoRevealNightOutcome: state.autoRevealNightOutcome,
    ...(state.nominations?.length ? { nominations: state.nominations } : {}),
    ...(state.myNominatedDefendantId
      ? { myNominatedDefendantId: state.myNominatedDefendantId }
      : {}),
    ...(state.pendingGuiltId ? { pendingGuiltId: state.pendingGuiltId } : {}),
    ...werewolfRoleStateToFirebase(state),
  };
}

export function werewolfStateFromFirebase(
  raw: FirebaseWerewolfPlayerState,
): WerewolfPlayerGameState {
  return {
    ...baseStateFromFirebase(raw),
    gameMode: GameMode.Werewolf,
    nominationsEnabled: raw.nominationsEnabled,
    ...(raw.trialsPerDay !== undefined
      ? { trialsPerDay: raw.trialsPerDay }
      : {}),
    ...(raw.concludedTrialsCount
      ? { concludedTrialsCount: raw.concludedTrialsCount }
      : {}),
    revealProtections: raw.revealProtections,
    autoRevealNightOutcome: raw.autoRevealNightOutcome ?? true,
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
    ...(raw.activeTrial
      ? {
          activeTrial:
            raw.activeTrial as WerewolfPlayerGameState["activeTrial"],
        }
      : {}),
    ...(raw.nominations?.length ? { nominations: raw.nominations } : {}),
    ...(raw.myNominatedDefendantId
      ? { myNominatedDefendantId: raw.myNominatedDefendantId }
      : {}),
    ...(raw.pendingGuiltId ? { pendingGuiltId: raw.pendingGuiltId } : {}),
    ...werewolfRoleStateFromFirebase(raw),
  } as WerewolfPlayerGameState;
}
