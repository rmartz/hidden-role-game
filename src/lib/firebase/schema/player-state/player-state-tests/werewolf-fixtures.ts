import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import { GameMode, GameStatus } from "@/lib/types";

const BASE_FIELDS = {
  lobbyId: "lobby-1",
  players: [{ id: "p1", name: "Alice", sessionId: "s1" }],
  visibleRoleAssignments: [],
  status: { type: GameStatus.Playing } as const,
};

export function makeWerewolfState(
  overrides: Partial<WerewolfPlayerGameState> = {},
): WerewolfPlayerGameState {
  return {
    ...BASE_FIELDS,
    gameMode: GameMode.Werewolf,
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    nominationsEnabled: true,
    trialsPerDay: undefined,
    revealProtections: true,
    autoRevealNightOutcome: true,
    ...overrides,
  };
}
