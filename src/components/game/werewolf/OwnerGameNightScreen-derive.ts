import type {
  AnyNightAction,
  WerewolfRoleDefinition,
  WerewolfTurnState,
} from "@/lib/game/modes/werewolf";
import {
  baseGroupPhaseKey,
  buildNarratorInstruction,
  getInvestigationResultForNarrator,
  getPhaseLabel,
  getTargetablePlayers,
  isGroupPhaseKey,
  isRoleActive,
  isTeamNightAction,
  TargetCategory,
} from "@/lib/game/modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { getWerewolfRole, WerewolfRole } from "@/lib/game/modes/werewolf/roles";
import type { InvestigationResultForNarrator } from "@/lib/game/modes/werewolf/utils/display";
import type { NarratorInstruction } from "@/lib/game/modes/werewolf/utils/narrator-instructions";
import { getPlayerName } from "@/lib/player";
import type { GameModeConfig } from "@/lib/types";

export interface ResolvedVote {
  key: string;
  voterName: string;
  targetName: string;
}

/** The narrator-facing night state derived for the active phase. */
export interface NightNarratorState {
  activePhaseLabel: string;
  activePlayerNames: string[];
  narratorInstruction?: NarratorInstruction;
  mercenaryCharged?: boolean;
  mirrorcasterCharged?: boolean;
  isWitchAbilitySkipped: boolean;
  isVeteranPhase: boolean;
  veteranAlertsUsed: number;
  isVeteranAlerted: boolean;
  veteranHasDecided: boolean;
  isActionConfirmed: boolean;
  isEvilEmpathPhase: boolean;
  evilEmpathNightResult?: boolean;
  hasGroupAction: boolean;
  resolvedVotes: ResolvedVote[];
  activeTargetName?: string;
  targetablePlayers: ReturnType<typeof getTargetablePlayers>;
  previousTargetId?: string;
  requiresDualTarget: boolean;
  secondTargetId?: string;
  dualTargetPrompt?: string;
  investigationResult?: InvestigationResultForNarrator;
  isResultRevealed: boolean;
  isIlluminatiPhase: boolean;
  isIlluminatiRevealed: boolean;
  exposerRevealText?: string;
  unconfirmedWarning?: string;
}

interface DeriveNightNarratorStateArgs {
  gameState: WerewolfPlayerGameState;
  turnState: WerewolfTurnState;
  modeConfig: GameModeConfig;
  activePhaseKey: string;
  activeAction?: AnyNightAction;
  activeTarget?: string;
  activeTargetConfirmed: boolean;
  nightActions: Record<string, AnyNightAction>;
  isFirstTurn: boolean;
}

/**
 * Derives the full narrator-facing state for the active night phase: which
 * players are awake, per-role prompts and results (veteran, witch, investigate,
 * illuminati, exposer, evil empath), dual-target selection prompts, cross-night
 * target exclusions, and the composite "unconfirmed" warning shown on advance.
 */
export function deriveNightNarratorState({
  gameState,
  turnState,
  modeConfig,
  activePhaseKey,
  activeAction,
  activeTarget,
  activeTargetConfirmed,
  nightActions,
  isFirstTurn,
}: DeriveNightNarratorStateArgs): NightNarratorState {
  const activePhaseLabel = getPhaseLabel(activePhaseKey, modeConfig.roles);
  const isGroupPhase = isGroupPhaseKey(activePhaseKey);
  // For suffixed repeat phases (e.g. "werewolf-werewolf:2"), strip the suffix
  // to match role IDs and look up role definitions.
  const baseActivePhaseKey = baseGroupPhaseKey(activePhaseKey);

  const activePlayerNames = gameState.visibleRoleAssignments
    .filter((a) => {
      // Narrator always receives role info (reason: "revealed"), but the
      // type allows role to be undefined for player-facing entries.
      if (!a.role) return false;
      if (a.role.id === baseActivePhaseKey) return true;
      if (isGroupPhase) {
        const roleDef = getWerewolfRole(a.role.id);
        return (
          (roleDef?.wakesWith as string | undefined) === baseActivePhaseKey
        );
      }
      return false;
    })
    .filter((a) => !turnState.deadPlayerIds.includes(a.player.id))
    .map((a) => getPlayerName(gameState.players, a.player.id) ?? a.player.id);

  const activeTargetName = activeTarget
    ? getPlayerName(gameState.players, activeTarget)
    : undefined;

  const groupAction =
    isGroupPhase && activeAction && isTeamNightAction(activeAction)
      ? activeAction
      : undefined;

  const activeRoleIds = isFirstTurn
    ? new Set(
        gameState.visibleRoleAssignments.flatMap((a) =>
          a.role ? [a.role.id] : [],
        ),
      )
    : new Set<string>();
  const narratorInstruction = isFirstTurn
    ? buildNarratorInstruction(activePhaseKey, activeRoleIds)
    : undefined;

  const isActionConfirmed = isGroupPhase
    ? !!groupAction?.confirmed
    : activeTargetConfirmed;
  const isWitchAbilitySkipped =
    isRoleActive(activePhaseKey, WerewolfRole.Witch) &&
    !!turnState.roleState?.witch?.abilityUsed;

  const isVeteranPhase =
    !isFirstTurn && isRoleActive(activePhaseKey, WerewolfRole.Veteran);
  const veteranAction =
    isVeteranPhase && activeAction && !isTeamNightAction(activeAction)
      ? activeAction
      : undefined;
  const isVeteranAlerted = veteranAction?.alerted === true;
  const veteranHasDecided = veteranAction !== undefined;
  const veteranAlertsUsed = turnState.roleState?.veteran?.alertsUsed ?? 0;

  const activeRoleDef = modeConfig.roles[baseActivePhaseKey] as
    | WerewolfRoleDefinition
    | undefined;
  const isInvestigatePhase =
    activeRoleDef?.targetCategory === TargetCategory.Investigate;
  const isResultRevealed = !!(
    activeAction &&
    "resultRevealed" in activeAction &&
    activeAction.resultRevealed
  );

  const isIlluminatiPhase = activeRoleDef?.revealsFullRoleList === true;
  const isIlluminatiRevealed =
    isIlluminatiPhase &&
    !!(
      activeAction &&
      !isTeamNightAction(activeAction) &&
      activeAction.resultRevealed
    );

  const {
    secondTargetId,
    requiresDualTarget,
    dualTargetPrompt,
    investigationResult,
  } = deriveTargetingState(
    activeRoleDef,
    activeAction,
    activeTarget,
    activeTargetName,
    isInvestigatePhase,
    activeTargetConfirmed,
    gameState,
    turnState,
    nightActions,
  );

  const exposerRevealData = turnState.roleState?.exposer?.reveal;
  const exposerRevealText = exposerRevealData
    ? WEREWOLF_COPY.narrator.exposerRevealLabel(
        getPlayerName(gameState.players, exposerRevealData.playerId) ??
          exposerRevealData.playerId,
        gameState.visibleRoleAssignments.find(
          (a) => a.player.id === exposerRevealData.playerId,
        )?.role?.name ?? exposerRevealData.roleId,
      )
    : undefined;

  const isEvilEmpathPhase = isRoleActive(
    activePhaseKey,
    WerewolfRole.EvilEmpath,
  );
  const evilEmpathNightResult =
    isEvilEmpathPhase &&
    turnState.roleState?.evilEmpath?.lastResult !== undefined
      ? turnState.roleState.evilEmpath.lastResult
      : undefined;

  const unconfirmedWarning =
    !isFirstTurn && !isWitchAbilitySkipped && !isActionConfirmed
      ? WEREWOLF_COPY.narrator.playerUnconfirmed
      : investigationResult && !isResultRevealed
        ? WEREWOLF_COPY.narrator.investigationUnrevealed
        : isIlluminatiPhase && !isIlluminatiRevealed
          ? WEREWOLF_COPY.illuminati.revealUnconfirmed
          : undefined;

  const resolvedVotes = (groupAction?.votes ?? []).map((vote) => ({
    key: vote.playerId,
    voterName: getPlayerName(gameState.players, vote.playerId) ?? vote.playerId,
    targetName: vote.skipped
      ? WEREWOLF_COPY.targetSelection.noTarget
      : (getPlayerName(gameState.players, vote.targetPlayerId) ?? "Unknown"),
  }));

  // Cross-night exclusion for roles with preventRepeatTarget (Bodyguard, Spellcaster).
  // Within-night exclusion for suffixed repeat group phases (e.g. "werewolf-werewolf:2"):
  // the second phase cannot target whoever the first phase selected.
  const previousTargetId = derivePreviousTargetId(
    activeRoleDef,
    activePhaseKey,
    baseActivePhaseKey,
    turnState,
    nightActions,
  );

  const targetablePlayers = getTargetablePlayers(
    gameState.players,
    gameState.gameOwner?.id,
    turnState.deadPlayerIds,
    activePhaseKey,
    undefined,
    gameState.visibleRoleAssignments,
  );

  return {
    activePhaseLabel,
    activePlayerNames,
    narratorInstruction,
    mercenaryCharged: turnState.roleState?.mercenary?.charged,
    mirrorcasterCharged: turnState.roleState?.mirrorcaster?.charged,
    isWitchAbilitySkipped,
    isVeteranPhase,
    veteranAlertsUsed,
    isVeteranAlerted,
    veteranHasDecided,
    isActionConfirmed,
    isEvilEmpathPhase,
    evilEmpathNightResult,
    hasGroupAction: !!groupAction,
    resolvedVotes,
    activeTargetName,
    targetablePlayers,
    previousTargetId,
    requiresDualTarget,
    secondTargetId,
    dualTargetPrompt,
    investigationResult,
    isResultRevealed,
    isIlluminatiPhase,
    isIlluminatiRevealed,
    exposerRevealText,
    unconfirmedWarning,
  };
}

function deriveDualTargetPrompt(
  activeRoleDef: WerewolfRoleDefinition | undefined,
  activeTarget: string | undefined,
  activeTargetName: string | undefined,
  secondTargetId: string | undefined,
  secondTargetName: string | undefined,
): string | undefined {
  if (activeRoleDef?.dualTargetSwap) {
    return activeTarget !== undefined && secondTargetId !== undefined
      ? WEREWOLF_COPY.swapper.narratorTwoTargets(
          activeTargetName ?? activeTarget,
          secondTargetName ?? secondTargetId,
        )
      : activeTarget !== undefined
        ? WEREWOLF_COPY.swapper.narratorOneTarget
        : WEREWOLF_COPY.swapper.narratorNoTargets;
  }
  if (activeRoleDef?.dualTargetInvestigate) {
    return activeTarget !== undefined && secondTargetId !== undefined
      ? WEREWOLF_COPY.mentalist.narratorTwoTargets(
          activeTargetName ?? activeTarget,
          secondTargetName ?? secondTargetId,
        )
      : activeTarget !== undefined
        ? WEREWOLF_COPY.mentalist.narratorOneTarget
        : WEREWOLF_COPY.mentalist.narratorNoTargets;
  }
  return undefined;
}

function derivePreviousTargetId(
  activeRoleDef: WerewolfRoleDefinition | undefined,
  activePhaseKey: string,
  baseActivePhaseKey: string,
  turnState: WerewolfTurnState,
  nightActions: Record<string, AnyNightAction>,
): string | undefined {
  if (activeRoleDef?.preventRepeatTarget) {
    return turnState.lastTargets?.[baseActivePhaseKey];
  }
  if (baseActivePhaseKey === activePhaseKey) return undefined;
  const baseAction = nightActions[baseActivePhaseKey];
  return baseAction && isTeamNightAction(baseAction)
    ? baseAction.suggestedTargetId
    : undefined;
}

interface TargetingState {
  secondTargetId: string | undefined;
  requiresDualTarget: boolean;
  dualTargetPrompt: string | undefined;
  investigationResult: InvestigationResultForNarrator | undefined;
}

function deriveTargetingState(
  activeRoleDef: WerewolfRoleDefinition | undefined,
  activeAction: AnyNightAction | undefined,
  activeTarget: string | undefined,
  activeTargetName: string | undefined,
  isInvestigatePhase: boolean,
  activeTargetConfirmed: boolean,
  gameState: WerewolfPlayerGameState,
  turnState: WerewolfTurnState,
  nightActions: Record<string, AnyNightAction>,
): TargetingState {
  const secondTargetId =
    activeAction && !isTeamNightAction(activeAction)
      ? activeAction.secondTargetPlayerId
      : undefined;
  const secondTargetName = secondTargetId
    ? (getPlayerName(gameState.players, secondTargetId) ?? secondTargetId)
    : undefined;

  const illusionAction = nightActions[WerewolfRole.IllusionArtist as string];
  const illusionTargetId =
    illusionAction &&
    !isTeamNightAction(illusionAction) &&
    illusionAction.confirmed
      ? illusionAction.targetPlayerId
      : undefined;

  const requiresDualTarget =
    activeRoleDef?.dualTargetSwap === true ||
    activeRoleDef?.dualTargetInvestigate === true;

  const dualTargetPrompt = deriveDualTargetPrompt(
    activeRoleDef,
    activeTarget,
    activeTargetName,
    secondTargetId,
    secondTargetName,
  );

  const investigationResult = getInvestigationResultForNarrator(
    isInvestigatePhase,
    activeTarget,
    activeTargetConfirmed,
    activeTargetName,
    gameState.visibleRoleAssignments,
    activeRoleDef,
    secondTargetId,
    secondTargetName,
    illusionTargetId,
    turnState.roleOverrides,
  );

  return {
    secondTargetId,
    requiresDualTarget,
    dualTargetPrompt,
    investigationResult,
  };
}
