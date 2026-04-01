import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ElectionNominationView } from "./ElectionNominationView";

const eligiblePlayers = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
];

const meta = {
  component: ElectionNominationView,
  args: {
    onSelectPlayer: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof ElectionNominationView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PresidentView: Story = {
  args: {
    presidentName: "Alice",
    eligiblePlayers,
    isPresident: true,
  },
};

export const PresidentWithSelection: Story = {
  args: {
    presidentName: "Alice",
    eligiblePlayers,
    selectedPlayerId: "p2",
    isPresident: true,
  },
};

export const NonPresidentView: Story = {
  args: {
    presidentName: "Alice",
    eligiblePlayers,
    isPresident: false,
  },
};

export const Pending: Story = {
  args: {
    presidentName: "Alice",
    eligiblePlayers,
    selectedPlayerId: "p2",
    isPresident: true,
    isPending: true,
  },
};
