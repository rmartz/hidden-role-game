import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameMode, GameStatus } from "@/lib/types";
import { WerewolfPhase } from "@/lib/game/modes/werewolf";
import type { WerewolfNighttimePhase } from "@/lib/game/modes/werewolf";
import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { GhostNightObserverScreen } from "./GhostNightObserverScreen";

const meta = {
  component: GhostNightObserverScreen,
} satisfies Meta<typeof GhostNightObserverScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const players = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
  { id: "p4", name: "Diana" },
  { id: "p5", name: "Eve" },
];

const baseGameState: WerewolfPlayerGameState = {
  gameMode: GameMode.Werewolf,
  status: { type: GameStatus.Playing },
  lobbyId: "lobby-1",
  players,
  visibleRoleAssignments: [],
  timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  nominationsEnabled: false,
  trialsPerDay: 1,
  revealProtections: true,
  autoRevealNightOutcome: true,
  ghostVisible: true,
  amDead: true,
};

const firstPhase: WerewolfNighttimePhase = {
  type: WerewolfPhase.Nighttime,
  startedAt: 1000,
  nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
  currentPhaseIndex: 0,
  nightActions: {},
};

export const NoPriorActivity: Story = {
  args: {
    gameState: baseGameState,
    phase: firstPhase,
  },
};

export const WithCompletedPhases: Story = {
  args: {
    gameState: baseGameState,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Seer],
      currentPhaseIndex: 1,
      nightActions: {
        [WerewolfRole.Werewolf]: {
          votes: [{ playerId: "p1", targetPlayerId: "p3" }],
          suggestedTargetId: "p3",
          confirmed: true,
        },
      },
    } satisfies WerewolfNighttimePhase,
  },
};

export const WithSkippedPhase: Story = {
  args: {
    gameState: baseGameState,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Seer, WerewolfRole.Werewolf],
      currentPhaseIndex: 1,
      nightActions: {
        [WerewolfRole.Seer]: {
          skipped: true,
          confirmed: true,
        },
      },
    } satisfies WerewolfNighttimePhase,
  },
};
