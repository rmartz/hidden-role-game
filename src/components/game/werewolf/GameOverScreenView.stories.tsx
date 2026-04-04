import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameOverScreenView } from "./GameOverScreenView";
import { GameMode, GameStatus, Team } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game-modes/werewolf/timer-config";
import { WerewolfWinner } from "@/lib/game-modes/werewolf/utils/win-condition";
import type { WerewolfPlayerGameState } from "@/lib/game-modes/werewolf/player-state";
import { fn } from "storybook/test";

const meta = {
  component: GameOverScreenView,
  args: {
    onReturnToLobby: fn(),
  },
} satisfies Meta<typeof GameOverScreenView>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseGameState: WerewolfPlayerGameState = {
  status: { type: GameStatus.Finished, winner: WerewolfWinner.Village },
  gameMode: GameMode.Werewolf,
  lobbyId: "lobby-1",
  players: [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
    { id: "p3", name: "Charlie" },
    { id: "p4", name: "Diana" },
  ],
  visibleRoleAssignments: [
    {
      player: { id: "p1", name: "Alice" },
      reason: "revealed",
      role: { id: "werewolf-seer", name: "Seer", team: Team.Good },
    },
    {
      player: { id: "p2", name: "Bob" },
      reason: "revealed",
      role: { id: "werewolf-werewolf", name: "Werewolf", team: Team.Bad },
    },
    {
      player: { id: "p3", name: "Charlie" },
      reason: "revealed",
      role: { id: "werewolf-villager", name: "Villager", team: Team.Good },
    },
    {
      player: { id: "p4", name: "Diana" },
      reason: "revealed",
      role: { id: "werewolf-bodyguard", name: "Bodyguard", team: Team.Good },
    },
  ],
  nominationsEnabled: false,
  singleTrialPerDay: true,
  revealProtections: true,
  timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
};

export const GoodTeamVictory: Story = {
  args: {
    gameState: {
      ...baseGameState,
      myPlayerId: "p1",
      myRole: { id: "werewolf-seer", name: "Seer", team: Team.Good },
    },
  },
};

export const GoodTeamDefeat: Story = {
  args: {
    gameState: {
      ...baseGameState,
      status: {
        type: GameStatus.Finished,
        winner: WerewolfWinner.Werewolves,
      },
      myPlayerId: "p1",
      myRole: { id: "werewolf-seer", name: "Seer", team: Team.Good },
    },
  },
};

export const BadTeamVictory: Story = {
  args: {
    gameState: {
      ...baseGameState,
      status: {
        type: GameStatus.Finished,
        winner: WerewolfWinner.Werewolves,
      },
      myPlayerId: "p2",
      myRole: { id: "werewolf-werewolf", name: "Werewolf", team: Team.Bad },
    },
  },
};

export const NarratorView: Story = {
  args: {
    gameState: baseGameState,
  },
};

export const Draw: Story = {
  args: {
    gameState: {
      ...baseGameState,
      status: { type: GameStatus.Finished, winner: WerewolfWinner.Draw },
      myPlayerId: "p1",
      myRole: { id: "werewolf-seer", name: "Seer", team: Team.Good },
    },
  },
};

export const ReturnError: Story = {
  args: {
    gameState: {
      ...baseGameState,
      myPlayerId: "p1",
      myRole: { id: "werewolf-seer", name: "Seer", team: Team.Good },
    },
    returnError: true,
  },
};
