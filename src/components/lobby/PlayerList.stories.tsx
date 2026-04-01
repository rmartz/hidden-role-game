import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerList } from "./PlayerList";
import {
  GameMode,
  RoleConfigMode,
  ShowRolesInPlay,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import type { PublicLobby } from "@/server/types";
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const meta = {
  component: PlayerList,
  args: {
    onRefetch: noop,
    onRemovePlayer: noop,
    onTransferOwner: noop,
    onToggleReady: noop,
  },
} satisfies Meta<typeof PlayerList>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseLobby: PublicLobby = {
  id: "lobby-abc123",
  ownerPlayerId: "p1",
  players: [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
    { id: "p3", name: "Charlie" },
    { id: "p4", name: "Diana" },
    { id: "p5", name: "Eve" },
  ],
  config: {
    gameMode: GameMode.Werewolf,
    roleConfigMode: RoleConfigMode.Default,
    showConfigToPlayers: true,
    showRolesInPlay: ShowRolesInPlay.AssignedRolesOnly,
    timerConfig: DEFAULT_TIMER_CONFIG,
    nominationsEnabled: false,
    singleTrialPerDay: false,
    revealProtections: false,
  },
  readyPlayerIds: ["p2", "p4"],
};

export const WithSeveralPlayers: Story = {
  args: {
    lobby: baseLobby,
    userPlayerId: "p3",
    isOwner: false,
    showLeave: true,
    showRemovePlayer: false,
    showMakeOwner: false,
    showRefresh: true,
    isFetching: false,
    disabled: false,
    isReadyPending: false,
  },
};

export const SinglePlayerOwner: Story = {
  args: {
    lobby: {
      ...baseLobby,
      players: [{ id: "p1", name: "Alice" }],
      readyPlayerIds: [],
    },
    userPlayerId: "p1",
    isOwner: true,
    showLeave: false,
    showRemovePlayer: false,
    showMakeOwner: false,
    showRefresh: true,
    isFetching: false,
    disabled: false,
    isReadyPending: false,
  },
};
