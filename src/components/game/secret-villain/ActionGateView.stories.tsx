import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ActionGateView } from "./ActionGateView";

const meta = {
  component: ActionGateView,
} satisfies Meta<typeof ActionGateView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onReveal: () => undefined,
  },
};
