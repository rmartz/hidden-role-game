import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { VeteranActionPanelView } from "./VeteranActionPanelView";

const meta = {
  component: VeteranActionPanelView,
  args: {
    onAlert: fn(),
    onSkip: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof VeteranActionPanelView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoDecision: Story = {
  args: {
    alertsUsed: 0,
    isAlerted: false,
    hasDecided: false,
    isConfirmed: false,
    isPending: false,
  },
};

export const AlertSelected: Story = {
  args: {
    alertsUsed: 1,
    isAlerted: true,
    hasDecided: true,
    isConfirmed: false,
    isPending: false,
  },
};

export const SkipSelected: Story = {
  args: {
    alertsUsed: 2,
    isAlerted: false,
    hasDecided: true,
    isConfirmed: false,
    isPending: false,
  },
};

export const AlertsExhausted: Story = {
  args: {
    alertsUsed: 3,
    isAlerted: false,
    hasDecided: false,
    isConfirmed: false,
    isPending: false,
  },
};

export const Confirmed: Story = {
  args: {
    alertsUsed: 1,
    isAlerted: true,
    hasDecided: true,
    isConfirmed: true,
    isPending: false,
  },
};

export const Pending: Story = {
  args: {
    alertsUsed: 0,
    isAlerted: false,
    hasDecided: false,
    isConfirmed: false,
    isPending: true,
  },
};
