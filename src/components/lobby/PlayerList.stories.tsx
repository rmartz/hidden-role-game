import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { PlayerList } from "./PlayerList";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
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
    onReorderPlayers: fn(),
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
  playerOrder: ["p1", "p2", "p3", "p4", "p5"],
  config: {
    gameMode: GameMode.Werewolf,
    roleConfigMode: RoleConfigMode.Default,
    showConfigToPlayers: true,
    showRolesInPlay: ShowRolesInPlay.AssignedRolesOnly,
    roleBuckets: [],
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: true,
      singleTrialPerDay: true,
      revealProtections: true,
    },
  },
  readyPlayerIds: ["p2", "p4"],
};

export const PlayerView: Story = {
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

export const OwnerView: Story = {
  args: {
    lobby: baseLobby,
    userPlayerId: "p1",
    isOwner: true,
    showLeave: false,
    showRemovePlayer: true,
    showMakeOwner: true,
    showRefresh: false,
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
      playerOrder: ["p1"],
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
