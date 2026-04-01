import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { PolicyPresidentView } from "./PolicyPresidentView";

const meta = {
  component: PolicyPresidentView,
  args: {
    onSelectCard: fn(),
    onDiscard: fn(),
  },
} satisfies Meta<typeof PolicyPresidentView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PresidentView: Story = {
  args: {
    drawnCards: ["good", "bad", "bad"],
    isPresident: true,
    presidentName: "Alice",
  },
};

export const PresidentWithSelection: Story = {
  args: {
    drawnCards: ["good", "bad", "bad"],
    selectedIndex: 1,
    isPresident: true,
    presidentName: "Alice",
  },
};

export const NonPresidentView: Story = {
  args: {
    drawnCards: [],
    isPresident: false,
    presidentName: "Alice",
  },
};

export const Pending: Story = {
  args: {
    drawnCards: ["good", "bad", "bad"],
    selectedIndex: 2,
    isPresident: true,
    presidentName: "Alice",
    isPending: true,
  },
};
