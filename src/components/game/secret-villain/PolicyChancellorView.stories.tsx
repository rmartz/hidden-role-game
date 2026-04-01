import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { PolicyChancellorView } from "./PolicyChancellorView";

const meta = {
  component: PolicyChancellorView,
  args: {
    onSelectCard: fn(),
    onPlay: fn(),
    onProposeVeto: fn(),
  },
} satisfies Meta<typeof PolicyChancellorView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ChancellorView: Story = {
  args: {
    remainingCards: ["good", "bad"],
    isChancellor: true,
    chancellorName: "Bob",
  },
};

export const ChancellorWithSelection: Story = {
  args: {
    remainingCards: ["good", "bad"],
    selectedIndex: 0,
    isChancellor: true,
    chancellorName: "Bob",
  },
};

export const VetoAvailable: Story = {
  args: {
    remainingCards: ["good", "bad"],
    isChancellor: true,
    chancellorName: "Bob",
    vetoUnlocked: true,
  },
};

export const VetoProposed: Story = {
  args: {
    remainingCards: ["good", "bad"],
    isChancellor: true,
    chancellorName: "Bob",
    vetoUnlocked: true,
    vetoProposed: true,
    vetoResponse: undefined,
  },
};

export const VetoRejected: Story = {
  args: {
    remainingCards: ["good", "bad"],
    isChancellor: true,
    chancellorName: "Bob",
    vetoUnlocked: true,
    vetoProposed: true,
    vetoResponse: false,
  },
};

export const NonChancellorView: Story = {
  args: {
    remainingCards: [],
    isChancellor: false,
    chancellorName: "Bob",
  },
};
