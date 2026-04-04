import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { PolicyPresidentView } from "./PolicyPresidentView";

const meta = {
  component: PolicyPresidentView,
  args: {
    onSelectCard: fn(),
    onDraw: fn(),
    onDiscard: fn(),
  },
} satisfies Meta<typeof PolicyPresidentView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BeforeDraw: Story = {
  args: {
    drawnCards: [],
    isPresident: true,
    presidentName: "Alice",
  },
};

export const AfterDraw: Story = {
  args: {
    drawnCards: ["good", "bad", "bad"],
    cardsRevealed: true,
    isPresident: true,
    presidentName: "Alice",
  },
};

export const WithSelection: Story = {
  args: {
    drawnCards: ["good", "bad", "bad"],
    cardsRevealed: true,
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
    cardsRevealed: true,
    selectedIndex: 2,
    isPresident: true,
    presidentName: "Alice",
    isPending: true,
  },
};
