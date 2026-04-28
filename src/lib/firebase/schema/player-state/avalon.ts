import { GameMode } from "@/lib/types";
import type { AvalonPlayerGameState } from "@/lib/game/modes/avalon/player-state";
import {
  type FirebaseBasePlayerState,
  baseStateToFirebase,
  baseStateFromFirebase,
} from "./base";

// ---------------------------------------------------------------------------
// Avalon-specific Firebase player state
// ---------------------------------------------------------------------------

export interface FirebaseAvalonPlayerState extends FirebaseBasePlayerState {
  /** JSON-serialized QuestResult[]. */
  questResults?: string;
  /** JSON-serialized AvalonCurrentQuest. */
  currentQuest?: string;
  /** JSON-serialized AvalonPublicPhase. */
  avalonPhase?: string;
  proposedTeam?: string[];
  /** TeamVote enum value stored as string. */
  myTeamVote?: string;
  /** JSON-serialized { playerId: string; vote: TeamVote }[]. */
  avalonTeamVotes?: string;
  teamVotePassed?: boolean;
  consecutiveRejections?: number;
  /** QuestCard enum value stored as string. */
  myQuestCard?: string;
  questFailCount?: number;
  assassinationTarget?: string;
  eligibleTeamMemberIds?: string[];
  assassinationTargetIds?: string[];
}

// ---------------------------------------------------------------------------
// Avalon serializer / deserializer
// ---------------------------------------------------------------------------

export function avalonStateToFirebase(
  state: AvalonPlayerGameState,
): FirebaseAvalonPlayerState {
  return {
    ...baseStateToFirebase(state),
    ...(state.questResults !== undefined
      ? { questResults: JSON.stringify(state.questResults) }
      : {}),
    ...(state.currentQuest !== undefined
      ? { currentQuest: JSON.stringify(state.currentQuest) }
      : {}),
    ...(state.avalonPhase !== undefined
      ? { avalonPhase: JSON.stringify(state.avalonPhase) }
      : {}),
    ...(state.proposedTeam?.length ? { proposedTeam: state.proposedTeam } : {}),
    ...(state.myTeamVote !== undefined ? { myTeamVote: state.myTeamVote } : {}),
    ...(state.teamVotes?.length
      ? { avalonTeamVotes: JSON.stringify(state.teamVotes) }
      : {}),
    ...(state.teamVotePassed !== undefined
      ? { teamVotePassed: state.teamVotePassed }
      : {}),
    ...(state.consecutiveRejections !== undefined
      ? { consecutiveRejections: state.consecutiveRejections }
      : {}),
    ...(state.myQuestCard !== undefined
      ? { myQuestCard: state.myQuestCard }
      : {}),
    ...(state.questFailCount !== undefined
      ? { questFailCount: state.questFailCount }
      : {}),
    ...(state.assassinationTarget !== undefined
      ? { assassinationTarget: state.assassinationTarget }
      : {}),
    ...(state.eligibleTeamMemberIds?.length
      ? { eligibleTeamMemberIds: state.eligibleTeamMemberIds }
      : {}),
    ...(state.assassinationTargetIds?.length
      ? { assassinationTargetIds: state.assassinationTargetIds }
      : {}),
  };
}

export function avalonStateFromFirebase(
  raw: FirebaseAvalonPlayerState,
): AvalonPlayerGameState {
  return {
    ...baseStateFromFirebase(raw),
    gameMode: GameMode.Avalon,
    ...(raw.questResults !== undefined
      ? {
          questResults: JSON.parse(
            raw.questResults,
          ) as AvalonPlayerGameState["questResults"],
        }
      : {}),
    ...(raw.currentQuest !== undefined
      ? {
          currentQuest: JSON.parse(
            raw.currentQuest,
          ) as AvalonPlayerGameState["currentQuest"],
        }
      : {}),
    ...(raw.avalonPhase !== undefined
      ? {
          avalonPhase: JSON.parse(
            raw.avalonPhase,
          ) as AvalonPlayerGameState["avalonPhase"],
        }
      : {}),
    ...(raw.proposedTeam?.length ? { proposedTeam: raw.proposedTeam } : {}),
    ...(raw.myTeamVote !== undefined
      ? {
          myTeamVote: raw.myTeamVote as AvalonPlayerGameState["myTeamVote"],
        }
      : {}),
    ...(raw.avalonTeamVotes !== undefined
      ? {
          teamVotes: JSON.parse(
            raw.avalonTeamVotes,
          ) as AvalonPlayerGameState["teamVotes"],
        }
      : {}),
    ...(raw.teamVotePassed !== undefined
      ? { teamVotePassed: raw.teamVotePassed }
      : {}),
    ...(raw.consecutiveRejections !== undefined
      ? { consecutiveRejections: raw.consecutiveRejections }
      : {}),
    ...(raw.myQuestCard !== undefined
      ? {
          myQuestCard: raw.myQuestCard as AvalonPlayerGameState["myQuestCard"],
        }
      : {}),
    ...(raw.questFailCount !== undefined
      ? { questFailCount: raw.questFailCount }
      : {}),
    ...(raw.assassinationTarget !== undefined
      ? { assassinationTarget: raw.assassinationTarget }
      : {}),
    ...(raw.eligibleTeamMemberIds?.length
      ? { eligibleTeamMemberIds: raw.eligibleTeamMemberIds }
      : {}),
    ...(raw.assassinationTargetIds?.length
      ? { assassinationTargetIds: raw.assassinationTargetIds }
      : {}),
  };
}
