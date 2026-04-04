import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { PolicyPeekView } from "./PolicyPeekView";

const meta = {
  component: PolicyPeekView,
  args: {
    peekedCards: ["bad", "good", "bad"],
    onConfirm: fn(),
  },
} satisfies Meta<typeof PolicyPeekView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllGood: Story = {
  args: {
    peekedCards: ["good", "good", "good"],
  },
};

export const Pending: Story = {
  args: {
    isPending: true,
  },
};
