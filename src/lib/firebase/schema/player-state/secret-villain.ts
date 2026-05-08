import { GameMode } from "@/lib/types";
import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";
import {
  type FirebaseBasePlayerState,
  baseStateToFirebase,
  baseStateFromFirebase,
} from "./base";

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
  /** JSON-serialized SvSpecialBadRevealState. */
  svSpecialBadReveal?: string;
  /** JSON-serialized SvInvestigationResult. */
  svInvestigationResult?: string;
  svInvestigationConsent?: boolean;
  svInvestigationWaitingForPlayerId?: string;
}

// ---------------------------------------------------------------------------
// Secret Villain serializer / deserializer
// ---------------------------------------------------------------------------

export function secretVillainStateToFirebase(
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
    ...(state.svSpecialBadReveal !== undefined
      ? { svSpecialBadReveal: JSON.stringify(state.svSpecialBadReveal) }
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

export function secretVillainStateFromFirebase(
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
    ...(raw.svSpecialBadReveal !== undefined
      ? {
          svSpecialBadReveal: JSON.parse(
            raw.svSpecialBadReveal,
          ) as SecretVillainPlayerGameState["svSpecialBadReveal"],
        }
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
