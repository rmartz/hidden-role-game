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
