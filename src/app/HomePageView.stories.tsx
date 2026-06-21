import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { GameMode } from "@/lib/types";

import { HomePageView } from "./HomePageView";

const noop = fn();

const meta = {
  title: "app/HomePageView",
  component: HomePageView,
  args: {
    playerName: "Alice",
    lobbyIdInput: "",
    selectedGameMode: GameMode.Werewolf,
    gameModeOptions: [{ value: GameMode.Werewolf, label: "Werewolf" }],
    activeLobby: undefined,
    storedLobbyId: undefined,
    error: undefined,
    loading: false,
    isCreatePending: false,
    isJoinPending: false,
    onPlayerNameChange: noop,
    onLobbyIdChange: noop,
    onGameModeChange: noop,
    onCreateLobby: noop,
    onJoinLobby: noop,
    onRejoinGame: noop,
    onRejoinLobby: noop,
  },
} satisfies Meta<typeof HomePageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoActiveLobby: Story = {};

export const ActiveLobbyWithGame: Story = {
  args: {
    activeLobby: { gameId: "game-abc123" },
    storedLobbyId: "lobby-abc123",
  },
};

export const ActiveLobbyWithoutGame: Story = {
  args: {
    activeLobby: { gameId: undefined },
    storedLobbyId: "lobby-abc123",
  },
};

export const ErrorState: Story = {
  args: {
    error: "Lobby not found.",
  },
};

export const CreatePending: Story = {
  args: {
    isCreatePending: true,
    loading: true,
  },
};

export const JoinPending: Story = {
  args: {
    lobbyIdInput: "lobby-abc123",
    isJoinPending: true,
    loading: true,
  },
};
