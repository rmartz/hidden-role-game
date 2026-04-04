import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { VetoPromptView } from "./VetoPromptView";

const meta = {
  component: VetoPromptView,
  args: {
    onAccept: fn(),
    onReject: fn(),
  },
} satisfies Meta<typeof VetoPromptView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Pending: Story = {
  args: {
    isPending: true,
  },
};
