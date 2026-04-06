import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SecretVillainStartingView } from "./SecretVillainStartingView";
import { GameMode, GameStatus, Team } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game-modes/secret-villain/timer-config";
import { SvTheme } from "@/lib/game-modes/secret-villain/themes";
import type { SecretVillainPlayerGameState } from "@/lib/game-modes/secret-villain/player-state";

const meta = {
  component: SecretVillainStartingView,
} satisfies Meta<typeof SecretVillainStartingView>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseGameState: SecretVillainPlayerGameState = {
  status: { type: GameStatus.Starting, startedAt: Date.now() },
  gameMode: GameMode.SecretVillain,
  lobbyId: "lobby-1",
  players: [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
    { id: "p3", name: "Charlie" },
    { id: "p4", name: "Diana" },
    { id: "p5", name: "Eve" },
  ],
  visibleRoleAssignments: [],
  timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
};

export const GoodPlayer: Story = {
  args: {
    gameState: {
      ...baseGameState,
      myPlayerId: "p1",
      myRole: { id: "good", name: "Good Role", team: Team.Good },
    },
    secondsRemaining: 10,
  },
};

export const BadPlayer: Story = {
  args: {
    gameState: {
      ...baseGameState,
      myPlayerId: "p2",
      myRole: { id: "bad", name: "Bad Role", team: Team.Bad },
      visibleRoleAssignments: [
        {
          player: { id: "p3", name: "Charlie" },
          reason: "wake-partner",
          role: { id: "bad", name: "Bad Role", team: Team.Bad },
        },
        {
          player: { id: "p4", name: "Diana" },
          reason: "wake-partner",
          role: { id: "special-bad", name: "Special Bad Role", team: Team.Bad },
        },
      ],
    },
    secondsRemaining: 8,
  },
};

export const SpecialBadPlayer: Story = {
  args: {
    gameState: {
      ...baseGameState,
      myPlayerId: "p4",
      myRole: {
        id: "special-bad",
        name: "Special Bad Role",
        team: Team.Bad,
      },
    },
    secondsRemaining: 12,
  },
};

export const StarWarsTheme: Story = {
  args: {
    gameState: {
      ...baseGameState,
      svTheme: SvTheme.StarWars,
      myPlayerId: "p2",
      myRole: { id: "bad", name: "Bad Role", team: Team.Bad },
      visibleRoleAssignments: [
        {
          player: { id: "p3", name: "Charlie" },
          reason: "wake-partner",
          role: { id: "bad", name: "Bad Role", team: Team.Bad },
        },
        {
          player: { id: "p4", name: "Diana" },
          reason: "wake-partner",
          role: { id: "special-bad", name: "Special Bad Role", team: Team.Bad },
        },
      ],
    },
    secondsRemaining: 10,
  },
};

export const BusinessTheme: Story = {
  args: {
    gameState: {
      ...baseGameState,
      svTheme: SvTheme.Business,
      myPlayerId: "p1",
      myRole: { id: "good", name: "Good Role", team: Team.Good },
    },
    secondsRemaining: 10,
  },
};

export const NoCountdown: Story = {
  args: {
    gameState: {
      ...baseGameState,
      myPlayerId: "p1",
      myRole: { id: "good", name: "Good Role", team: Team.Good },
    },
  },
};
