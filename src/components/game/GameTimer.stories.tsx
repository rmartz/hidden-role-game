import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameTimer } from "./GameTimer";

const meta = {
  component: GameTimer,
} satisfies Meta<typeof GameTimer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CountingDown: Story = {
  args: {
    durationSeconds: 300,
    autoAdvance: false,
    startedAt: new Date(),
  },
};

export const Expired: Story = {
  args: {
    durationSeconds: 60,
    autoAdvance: false,
    startedAt: new Date(Date.now() - 120_000),
  },
};

export const AutoAdvance: Story = {
  args: {
    durationSeconds: 60,
    autoAdvance: true,
    startedAt: new Date(Date.now() - 120_000),
  },
};

export const Paused: Story = {
  args: {
    durationSeconds: 300,
    autoAdvance: false,
    startedAt: new Date(Date.now() - 60_000),
    pausedAt: new Date(Date.now() - 30_000),
    pauseOffset: 0,
  },
};

export const PausedWithOffset: Story = {
  args: {
    durationSeconds: 300,
    autoAdvance: false,
    // Phase started 120s ago, paused 60s ago, with 30s already in offset
    startedAt: new Date(Date.now() - 120_000),
    pausedAt: new Date(Date.now() - 60_000),
    pauseOffset: 30_000,
  },
};
