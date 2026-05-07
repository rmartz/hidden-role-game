import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { GhostCluePanelView } from "./GhostCluePanel";

const meta = {
  component: GhostCluePanelView,
  args: {
    onClueChange: fn(),
    onSubmit: fn(),
    isPending: false,
    clue: "",
    ghostClues: [],
    alreadySubmittedThisTurn: false,
  },
} satisfies Meta<typeof GhostCluePanelView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyInput: Story = {};

export const WithPriorClues: Story = {
  args: {
    ghostClues: [
      { turn: 1, clue: "wolf" },
      { turn: 2, clue: "north" },
    ],
  },
};

export const AlreadySubmitted: Story = {
  args: {
    ghostClues: [{ turn: 3, clue: "east" }],
    alreadySubmittedThisTurn: true,
  },
};

export const ClueTyped: Story = {
  args: {
    clue: "moon",
  },
};
