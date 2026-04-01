import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerNightSnoozeScreen } from "./PlayerNightSnoozeScreen";

const meta = {
  component: PlayerNightSnoozeScreen,
} satisfies Meta<typeof PlayerNightSnoozeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    amDead: false,
  },
};

export const DeadPlayer: Story = {
  args: {
    amDead: true,
  },
};
