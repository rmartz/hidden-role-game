import { GameMode } from "@/lib/types";
import type { Team } from "@/lib/types";
import type { AnyNightAction, DaytimeVote } from "@/lib/game/modes/werewolf";
import { TrialVerdict } from "@/lib/game/modes/werewolf";
import type { NightStatusEntry } from "@/server/types";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import {
  type FirebaseBasePlayerState,
  baseStateToFirebase,
  baseStateFromFirebase,
} from "./base";

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
    verdict?: TrialVerdict;
    mustVoteGuilty?: boolean;
    mustVoteInnocent?: boolean;
    voteResults?: { playerName: string; vote: DaytimeVote }[];
    eliminatedRole?: { id: string; name: string; team: string };
  };
  nominationsEnabled: boolean;
  trialsPerDay: number;
  concludedTrialsCount?: number;
  revealProtections: boolean;
  autoRevealNightOutcome?: boolean;
  executionerTargetId?: string;
  nominations?: { defendantId: string; nominatorIds: string[] }[];
  myNominatedDefendantId?: string;
  pendingSmitePlayerIds?: string[];
  mirrorcasterCharged?: boolean;
  oneEyedSeerLockedTargetId?: string;
  elusiveSeerVillagerIds?: string[];
  exposerReveal?: { playerName: string; roleName: string; team: string };
  mySecondNightTarget?: string;
  exposerAbilityUsed?: boolean;
  hunterRevengePlayerId?: string;
  /** Narrator-only hidden role IDs. Present only when hiddenRoleCount > 0. */
  hiddenRoleIds?: string[];
  thingTappedMe?: boolean;
  thingTappedPlayerId?: string;
  insomniacResult?: { leftActed: boolean; rightActed: boolean };
  countResult?: { leftCount: number; rightCount: number };
  adjacentPlayerIds?: string[];
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
    ...(state.witchAbilityUsed ? { witchAbilityUsed: true } : {}),
    ...(state.morticianAbilityEnded ? { morticianAbilityEnded: true } : {}),
    ...(state.priestWardActive ? { priestWardActive: true } : {}),
    ...(state.isSilenced ? { isSilenced: true } : {}),
    ...(state.isHypnotized ? { isHypnotized: true } : {}),
    ...(state.activeTrial ? { activeTrial: state.activeTrial } : {}),
    nominationsEnabled: state.nominationsEnabled,
    trialsPerDay: state.trialsPerDay,
    ...(state.concludedTrialsCount
      ? { concludedTrialsCount: state.concludedTrialsCount }
      : {}),
    revealProtections: state.revealProtections,
    autoRevealNightOutcome: state.autoRevealNightOutcome,
    ...(state.executionerTargetId
      ? { executionerTargetId: state.executionerTargetId }
      : {}),
    ...(state.nominations?.length ? { nominations: state.nominations } : {}),
    ...(state.myNominatedDefendantId
      ? { myNominatedDefendantId: state.myNominatedDefendantId }
      : {}),
    ...(state.pendingSmitePlayerIds?.length
      ? { pendingSmitePlayerIds: state.pendingSmitePlayerIds }
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
    ...(state.hiddenRoleIds?.length
      ? { hiddenRoleIds: state.hiddenRoleIds }
      : {}),
    ...(state.thingTappedMe ? { thingTappedMe: true } : {}),
    ...(state.thingTappedPlayerId
      ? { thingTappedPlayerId: state.thingTappedPlayerId }
      : {}),
    ...(state.insomniacResult
      ? { insomniacResult: state.insomniacResult }
      : {}),
    ...(state.countResult ? { countResult: state.countResult } : {}),
    ...(state.adjacentPlayerIds?.length
      ? { adjacentPlayerIds: state.adjacentPlayerIds }
      : {}),
  };
}

export function werewolfStateFromFirebase(
  raw: FirebaseWerewolfPlayerState,
): WerewolfPlayerGameState {
  return {
    ...baseStateFromFirebase(raw),
    gameMode: GameMode.Werewolf,
    nominationsEnabled: raw.nominationsEnabled,
    trialsPerDay: raw.trialsPerDay,
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
    ...(raw.pendingSmitePlayerIds?.length
      ? { pendingSmitePlayerIds: raw.pendingSmitePlayerIds }
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
    ...(raw.hiddenRoleIds?.length ? { hiddenRoleIds: raw.hiddenRoleIds } : {}),
    ...(raw.thingTappedMe ? { thingTappedMe: true } : {}),
    ...(raw.thingTappedPlayerId
      ? { thingTappedPlayerId: raw.thingTappedPlayerId }
      : {}),
    ...(raw.insomniacResult ? { insomniacResult: raw.insomniacResult } : {}),
    ...(raw.countResult ? { countResult: raw.countResult } : {}),
    ...(raw.adjacentPlayerIds?.length
      ? { adjacentPlayerIds: raw.adjacentPlayerIds }
      : {}),
  } as WerewolfPlayerGameState;
}
