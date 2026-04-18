import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { SpecialBadRevealView } from "./SpecialBadRevealView";

const meta = {
  component: SpecialBadRevealView,
  args: {
    chancellorName: "Alice",
    specialBadRoleName: "Hitler",
    badTeamLabel: "Fascist",
    badPolicyLabel: "Fascist Policy",
    onConfirm: fn(),
    onReveal: fn(),
    onContinue: fn(),
  },
} satisfies Meta<typeof SpecialBadRevealView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Waiting: Story = {
  args: {
    isChancellor: false,
  },
};

export const ChancellorDecision: Story = {
  args: {
    isChancellor: true,
  },
};

export const OutcomeConfirmed: Story = {
  args: {
    isChancellor: false,
    revealed: false,
  },
};

export const OutcomeRevealed: Story = {
  args: {
    isChancellor: false,
    revealed: true,
  },
};
