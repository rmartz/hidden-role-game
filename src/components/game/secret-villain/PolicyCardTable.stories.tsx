import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { PolicyCardTable } from "./PolicyCardTable";

const meta = {
  component: PolicyCardTable,
  args: {
    onSelectDiscard: fn(),
  },
} satisfies Meta<typeof PolicyCardTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// President's 3-card hand — no selection yet
export const PresidentHand: Story = {
  args: {
    cards: ["good", "bad", "bad"],
  },
};

// President's 3-card hand — second card (index 1) marked for discard
export const PresidentHandWithSelection: Story = {
  args: {
    cards: ["good", "bad", "bad"],
    discardIndex: 1,
  },
};

// Chancellor's 2-card hand — no selection yet
export const ChancellorHand: Story = {
  args: {
    cards: ["good", "bad"],
  },
};

// Chancellor's 2-card hand — first card (index 0) marked for discard
export const ChancellorHandWithSelection: Story = {
  args: {
    cards: ["good", "bad"],
    discardIndex: 0,
  },
};

// All bad cards (e.g. unlucky draw)
export const AllBad: Story = {
  args: {
    cards: ["bad", "bad", "bad"],
    discardIndex: 0,
  },
};

// Disabled (pending submission)
export const Disabled: Story = {
  args: {
    cards: ["good", "bad", "bad"],
    discardIndex: 2,
    disabled: true,
  },
};
