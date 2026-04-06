import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SecretVillainGameOverView } from "./SecretVillainGameOverView";
import { GameMode, GameStatus, Team } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game-modes/secret-villain/timer-config";
import { SecretVillainWinner } from "@/lib/game-modes/secret-villain/utils/win-condition";
import { SvTheme } from "@/lib/game-modes/secret-villain/themes";
import type { SecretVillainPlayerGameState } from "@/lib/game-modes/secret-villain/player-state";
import { fn } from "storybook/test";

const meta = {
  component: SecretVillainGameOverView,
  args: {
    onReturnToLobby: fn(),
  },
} satisfies Meta<typeof SecretVillainGameOverView>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseGameState: SecretVillainPlayerGameState = {
  status: { type: GameStatus.Finished, winner: SecretVillainWinner.Good },
  gameMode: GameMode.SecretVillain,
  lobbyId: "lobby-1",
  players: [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
    { id: "p3", name: "Charlie" },
  ],
  visibleRoleAssignments: [
    {
      player: { id: "p1", name: "Alice" },
      reason: "revealed",
      role: { id: "good", name: "Good Role", team: Team.Good },
    },
    {
      player: { id: "p2", name: "Bob" },
      reason: "revealed",
      role: { id: "bad", name: "Bad Role", team: Team.Bad },
    },
    {
      player: { id: "p3", name: "Charlie" },
      reason: "revealed",
      role: { id: "special-bad", name: "Special Bad Role", team: Team.Bad },
    },
  ],
  timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
};

export const GoodTeamVictory: Story = {
  args: {
    gameState: {
      ...baseGameState,
      myPlayerId: "p1",
      myRole: { id: "good", name: "Good Role", team: Team.Good },
    },
  },
};

export const GoodTeamDefeat: Story = {
  args: {
    gameState: {
      ...baseGameState,
      status: { type: GameStatus.Finished, winner: SecretVillainWinner.Bad },
      myPlayerId: "p1",
      myRole: { id: "good", name: "Good Role", team: Team.Good },
    },
  },
};

export const BadTeamVictory: Story = {
  args: {
    gameState: {
      ...baseGameState,
      status: { type: GameStatus.Finished, winner: SecretVillainWinner.Bad },
      myPlayerId: "p2",
      myRole: { id: "bad", name: "Bad Role", team: Team.Bad },
    },
  },
};

export const OriginalThemeGoodWins: Story = {
  args: {
    gameState: {
      ...baseGameState,
      svTheme: SvTheme.Original,
      myPlayerId: "p1",
      myRole: { id: "good", name: "Good Role", team: Team.Good },
    },
  },
};

export const StarWarsThemeBadWins: Story = {
  args: {
    gameState: {
      ...baseGameState,
      svTheme: SvTheme.StarWars,
      status: { type: GameStatus.Finished, winner: SecretVillainWinner.Bad },
      myPlayerId: "p2",
      myRole: { id: "bad", name: "Bad Role", team: Team.Bad },
    },
  },
};

export const ReturnError: Story = {
  args: {
    gameState: {
      ...baseGameState,
      myPlayerId: "p1",
      myRole: { id: "good", name: "Good Role", team: Team.Good },
    },
    returnError: true,
  },
};
