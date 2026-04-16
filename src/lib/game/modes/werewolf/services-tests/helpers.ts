import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import {
  WerewolfPhase,
  WerewolfRole,
  DEFAULT_WEREWOLF_TIMER_CONFIG,
  TrialPhase,
  DaytimeVote,
} from "@/lib/game/modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game/modes/werewolf";
import type { WerewolfModeConfig } from "@/lib/game/modes/werewolf";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import {
  extractDaytimeNightSummary,
  extractDaytimePlayerState,
} from "../services/owner-state";

// ---------------------------------------------------------------------------
// extractDaytimeState — combines the two new functions for test convenience
// ---------------------------------------------------------------------------

export function extractDaytimeState(
  game: Game,
  callerId: string,
): Partial<WerewolfPlayerGameState> {
  return {
    ...extractDaytimeNightSummary(game, callerId),
    ...extractDaytimePlayerState(game, callerId),
  };
}

// ---------------------------------------------------------------------------
// makeDaytimeGame
// ---------------------------------------------------------------------------

export function makeDaytimeGame(
  overrides: Partial<{
    nightActions: WerewolfTurnState["phase"]["nightActions"];
    nightResolution: Extract<
      WerewolfTurnState["phase"],
      { type: WerewolfPhase.Daytime }
    >["nightResolution"];
    nightOutcomeRevealStep: Extract<
      WerewolfTurnState["phase"],
      { type: WerewolfPhase.Daytime }
    >["nightOutcomeRevealStep"];
    deadPlayerIds: string[];
    modeConfig: Partial<WerewolfModeConfig>;
  }> = {},
): Game {
  const turnState: WerewolfTurnState = {
    turn: 2,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: overrides.nightActions ?? {},
      ...(overrides.nightOutcomeRevealStep !== undefined
        ? { nightOutcomeRevealStep: overrides.nightOutcomeRevealStep }
        : {}),
      ...(overrides.nightResolution !== undefined
        ? { nightResolution: overrides.nightResolution }
        : {}),
    },
    deadPlayerIds: overrides.deadPlayerIds ?? [],
  };
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "owner", name: "Owner", sessionId: "s0", visiblePlayers: [] },
      { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Bodyguard },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner",
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: false,
      trialsPerDay: 1,
      revealProtections: true,
      hiddenRoleCount: 0,
      showRolesOnDeath: true,
      autoRevealNightOutcome: true,
      ...(overrides.modeConfig ?? {}),
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  };
}

// ---------------------------------------------------------------------------
// makeDaytimeGameWithTrial (trial / mustVoteGuilty tests)
// ---------------------------------------------------------------------------

export function makeDaytimeGameWithTrial(callerRoleId: WerewolfRole): Game {
  const activeTrial = {
    defendantId: "p1",
    startedAt: 2000,
    phase: TrialPhase.Voting,
    votes: [] as { playerId: string; vote: DaytimeVote }[],
  };
  const turnState: WerewolfTurnState = {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      activeTrial,
    },
    deadPlayerIds: [],
  };
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: callerRoleId },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner",
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: false,
      trialsPerDay: 1,
      revealProtections: true,
      hiddenRoleCount: 0,
      showRolesOnDeath: true,
      autoRevealNightOutcome: true,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  };
}

// ---------------------------------------------------------------------------
// makeDaytimeGameWithNominations
// ---------------------------------------------------------------------------

export function makeDaytimeGameWithNominations(
  nominations: { nominatorId: string; defendantId: string }[],
  nominationsEnabled = false,
): Game {
  const turnState: WerewolfTurnState = {
    turn: 1,
    phase: {
      type: WerewolfPhase.Daytime,
      startedAt: 1000,
      nightActions: {},
      ...(nominations.length > 0 ? { nominations } : {}),
    },
    deadPlayerIds: [],
  };
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "owner", name: "Owner", sessionId: "s0", visiblePlayers: [] },
      { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner",
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled,
      trialsPerDay: 1,
      revealProtections: true,
      hiddenRoleCount: 0,
      showRolesOnDeath: true,
      autoRevealNightOutcome: true,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  };
}
