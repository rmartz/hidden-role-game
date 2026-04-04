import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { PlayerSelectionView } from "./PlayerSelectionView";

const players = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
];

const meta = {
  component: PlayerSelectionView,
  args: {
    heading: "Select a Player",
    instructions: "Choose a player to target.",
    confirmLabel: "Confirm",
    players,
    onSelectPlayer: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof PlayerSelectionView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSelection: Story = {
  args: {
    selectedPlayerId: "p2",
  },
};

export const Pending: Story = {
  args: {
    selectedPlayerId: "p1",
    isPending: true,
  },
};
