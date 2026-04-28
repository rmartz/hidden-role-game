import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { ClocktowerPhase } from "../types";
import type {
  ClocktowerNightPhase,
  ClocktowerTurnState,
  ClocktowerNightAction,
} from "../types";
import { ClocktowerRole } from "../roles";
import { DEFAULT_CLOCKTOWER_MODE_CONFIG } from "../lobby-config";
import { DEFAULT_TIMER_CONFIG } from "@/lib/types";

export const OWNER_ID = "owner-1";
export const IMP_PLAYER_ID = "p1";
export const EMPATH_PLAYER_ID = "p2";
export const FORTUNE_TELLER_PLAYER_ID = "p3";
export const WASHERWOMAN_PLAYER_ID = "p4";
export const MAYOR_PLAYER_ID = "p5";

export interface NightFixture {
  ts: ClocktowerTurnState;
  phase: ClocktowerNightPhase;
}

export function makeNightState(
  overrides: Partial<{
    turn: number;
    currentActionIndex: number;
    nightActions: Record<string, ClocktowerNightAction>;
    deadPlayerIds: string[];
  }> = {},
): ClocktowerTurnState {
  return {
    turn: overrides.turn ?? 1,
    phase: {
      type: ClocktowerPhase.Night,
      currentActionIndex: overrides.currentActionIndex ?? 0,
      nightActions: overrides.nightActions ?? {},
    },
    playerOrder: [
      IMP_PLAYER_ID,
      EMPATH_PLAYER_ID,
      FORTUNE_TELLER_PLAYER_ID,
      WASHERWOMAN_PLAYER_ID,
      MAYOR_PLAYER_ID,
    ],
    deadPlayerIds: overrides.deadPlayerIds ?? [],
    ghostVotesUsed: [],
    demonPlayerId: IMP_PLAYER_ID,
  };
}

export function makeNightTurnState(
  overrides: Partial<{
    turn: number;
    currentActionIndex: number;
    nightActions: Record<string, ClocktowerNightAction>;
    deadPlayerIds: string[];
    demonPlayerId: string;
    poisonedPlayerId: string;
  }> = {},
): NightFixture {
  const phase: ClocktowerNightPhase = {
    type: ClocktowerPhase.Night,
    currentActionIndex: overrides.currentActionIndex ?? 0,
    nightActions: overrides.nightActions ?? {},
  };
  const ts: ClocktowerTurnState = {
    turn: overrides.turn ?? 1,
    phase,
    playerOrder: ["p1", "p2", "p3", "p4", "p5"],
    deadPlayerIds: overrides.deadPlayerIds ?? [],
    ghostVotesUsed: [],
    demonPlayerId: overrides.demonPlayerId ?? "p1",
    poisonedPlayerId: overrides.poisonedPlayerId,
  };
  return { ts, phase };
}

export function makePlayingGame(
  turnState: ClocktowerTurnState | NightFixture,
  overrides: Partial<Game> = {},
): Game {
  const resolvedTurnState = "ts" in turnState ? turnState.ts : turnState;
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Clocktower,
    status: { type: GameStatus.Playing, turnState: resolvedTurnState },
    players: [
      { id: IMP_PLAYER_ID, name: "Alice", sessionId: "s1", visiblePlayers: [] },
      {
        id: EMPATH_PLAYER_ID,
        name: "Bob",
        sessionId: "s2",
        visiblePlayers: [],
      },
      {
        id: FORTUNE_TELLER_PLAYER_ID,
        name: "Charlie",
        sessionId: "s3",
        visiblePlayers: [],
      },
      {
        id: WASHERWOMAN_PLAYER_ID,
        name: "Dave",
        sessionId: "s4",
        visiblePlayers: [],
      },
      {
        id: MAYOR_PLAYER_ID,
        name: "Eve",
        sessionId: "s5",
        visiblePlayers: [],
      },
    ],
    roleAssignments: [
      { playerId: IMP_PLAYER_ID, roleDefinitionId: ClocktowerRole.Imp },
      { playerId: EMPATH_PLAYER_ID, roleDefinitionId: ClocktowerRole.Empath },
      {
        playerId: FORTUNE_TELLER_PLAYER_ID,
        roleDefinitionId: ClocktowerRole.FortuneTeller,
      },
      {
        playerId: WASHERWOMAN_PLAYER_ID,
        roleDefinitionId: ClocktowerRole.Washerwoman,
      },
      {
        playerId: MAYOR_PLAYER_ID,
        roleDefinitionId: ClocktowerRole.Mayor,
      },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: OWNER_ID,
    modeConfig: DEFAULT_CLOCKTOWER_MODE_CONFIG,
    timerConfig: DEFAULT_TIMER_CONFIG,
    ...overrides,
  } as Game;
}
