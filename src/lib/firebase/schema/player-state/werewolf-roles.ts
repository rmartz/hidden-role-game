import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import type { Team } from "@/lib/types";

// ---------------------------------------------------------------------------
// Role-specific Firebase player state
// ---------------------------------------------------------------------------

/**
 * Firebase wire-format fields for role-specific Werewolf player state.
 * Consumed by werewolfStateToFirebase / werewolfStateFromFirebase via delegation.
 * Adding a new role adds fields only to this interface and the two helpers below.
 */
export interface FirebaseWerewolfRoleState {
  witchAbilityUsed?: boolean;
  morticianAbilityEnded?: boolean;
  monarchKnightedPlayerIds?: string[];
  monarchKnightingsUsed?: number;
  priestWardActive?: boolean;
  isSilenced?: boolean;
  isHypnotized?: boolean;
  executionerTargetId?: string;
  mirrorcasterCharged?: boolean;
  mercenaryCharged?: boolean;
  mercenaryBribedPlayerIds?: string[];
  mercenaryAlsoWins?: boolean;
  oneEyedSeerLockedTargetId?: string;
  elusiveSeerVillagerIds?: string[];
  illuminatiRoleAssignments?: {
    playerId: string;
    roleName: string;
    team: string;
  }[];
  mySecondNightTarget?: string;
  exposerAbilityUsed?: boolean;
  hunterRevengePlayerId?: string;
  hiddenRoleIds?: string[];
  arsonistDousedPlayerIds?: string[];
  pendingSmitePlayerIds?: string[];
  /** True when this player has been blocked by the Tavern Keeper tonight. */
  tavernKeeperBlocked?: boolean;
  thingTappedMe?: boolean;
  thingTappedPlayerId?: string;
  insomniacResult?: { leftActed: boolean; rightActed: boolean };
  countResult?: { leftCount: number; rightCount: number };
  adjacentPlayerIds?: string[];
}

// ---------------------------------------------------------------------------
// Converters
// ---------------------------------------------------------------------------

export function werewolfRoleStateToFirebase(
  state: WerewolfPlayerGameState,
): FirebaseWerewolfRoleState {
  const monarchKnightingsUsed = state.monarchKnightingsUsed;
  return {
    ...(state.witchAbilityUsed ? { witchAbilityUsed: true } : {}),
    ...(state.morticianAbilityEnded ? { morticianAbilityEnded: true } : {}),
    ...(state.monarchKnightedPlayerIds?.length
      ? { monarchKnightedPlayerIds: state.monarchKnightedPlayerIds }
      : {}),
    ...((monarchKnightingsUsed ?? 0) > 0 ? { monarchKnightingsUsed } : {}),
    ...(state.priestWardActive ? { priestWardActive: true } : {}),
    ...(state.isSilenced ? { isSilenced: true } : {}),
    ...(state.isHypnotized ? { isHypnotized: true } : {}),
    ...(state.executionerTargetId
      ? { executionerTargetId: state.executionerTargetId }
      : {}),
    ...(state.mirrorcasterCharged ? { mirrorcasterCharged: true } : {}),
    ...(state.mercenaryCharged ? { mercenaryCharged: true } : {}),
    ...(state.mercenaryBribedPlayerIds?.length
      ? { mercenaryBribedPlayerIds: state.mercenaryBribedPlayerIds }
      : {}),
    ...(state.mercenaryAlsoWins ? { mercenaryAlsoWins: true } : {}),
    ...(state.oneEyedSeerLockedTargetId
      ? { oneEyedSeerLockedTargetId: state.oneEyedSeerLockedTargetId }
      : {}),
    ...(state.elusiveSeerVillagerIds?.length
      ? { elusiveSeerVillagerIds: state.elusiveSeerVillagerIds }
      : {}),
    ...(state.illuminatiRoleAssignments?.length
      ? { illuminatiRoleAssignments: state.illuminatiRoleAssignments }
      : {}),
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
    ...(state.arsonistDousedPlayerIds?.length
      ? { arsonistDousedPlayerIds: state.arsonistDousedPlayerIds }
      : {}),
    ...(state.pendingSmitePlayerIds?.length
      ? { pendingSmitePlayerIds: state.pendingSmitePlayerIds }
      : {}),
    ...(state.tavernKeeperBlocked ? { tavernKeeperBlocked: true } : {}),
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

export function werewolfRoleStateFromFirebase(
  raw: FirebaseWerewolfRoleState,
): Partial<WerewolfPlayerGameState> {
  const monarchKnightingsUsed = raw.monarchKnightingsUsed;
  return {
    ...(raw.witchAbilityUsed ? { witchAbilityUsed: true } : {}),
    ...(raw.morticianAbilityEnded ? { morticianAbilityEnded: true } : {}),
    ...(raw.monarchKnightedPlayerIds?.length
      ? { monarchKnightedPlayerIds: raw.monarchKnightedPlayerIds }
      : {}),
    ...((monarchKnightingsUsed ?? 0) > 0 ? { monarchKnightingsUsed } : {}),
    ...(raw.priestWardActive ? { priestWardActive: true } : {}),
    ...(raw.isSilenced ? { isSilenced: true } : {}),
    ...(raw.isHypnotized ? { isHypnotized: true } : {}),
    ...(raw.executionerTargetId
      ? { executionerTargetId: raw.executionerTargetId }
      : {}),
    ...(raw.mirrorcasterCharged ? { mirrorcasterCharged: true } : {}),
    ...(raw.mercenaryCharged ? { mercenaryCharged: true } : {}),
    ...(raw.mercenaryBribedPlayerIds?.length
      ? { mercenaryBribedPlayerIds: raw.mercenaryBribedPlayerIds }
      : {}),
    ...(raw.mercenaryAlsoWins ? { mercenaryAlsoWins: true } : {}),
    ...(raw.oneEyedSeerLockedTargetId
      ? { oneEyedSeerLockedTargetId: raw.oneEyedSeerLockedTargetId }
      : {}),
    ...(raw.elusiveSeerVillagerIds?.length
      ? { elusiveSeerVillagerIds: raw.elusiveSeerVillagerIds }
      : {}),
    ...(raw.illuminatiRoleAssignments?.length
      ? {
          illuminatiRoleAssignments: raw.illuminatiRoleAssignments.map((a) => ({
            ...a,
            team: a.team as Team,
          })),
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
    ...(raw.arsonistDousedPlayerIds?.length
      ? { arsonistDousedPlayerIds: raw.arsonistDousedPlayerIds }
      : {}),
    ...(raw.pendingSmitePlayerIds?.length
      ? { pendingSmitePlayerIds: raw.pendingSmitePlayerIds }
      : {}),
    ...(raw.tavernKeeperBlocked ? { tavernKeeperBlocked: true } : {}),
    ...(raw.thingTappedMe ? { thingTappedMe: true } : {}),
    ...(raw.thingTappedPlayerId
      ? { thingTappedPlayerId: raw.thingTappedPlayerId }
      : {}),
    ...(raw.insomniacResult ? { insomniacResult: raw.insomniacResult } : {}),
    ...(raw.countResult ? { countResult: raw.countResult } : {}),
    ...(raw.adjacentPlayerIds?.length
      ? { adjacentPlayerIds: raw.adjacentPlayerIds }
      : {}),
  };
}
