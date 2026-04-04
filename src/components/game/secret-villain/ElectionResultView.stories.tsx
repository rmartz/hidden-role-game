import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ElectionResultView } from "./ElectionResultView";

const meta = {
  component: ElectionResultView,
  args: {
    onContinue: fn(),
  },
} satisfies Meta<typeof ElectionResultView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Passed: Story = {
  args: {
    presidentName: "Alice",
    chancellorNomineeName: "Bob",
    passed: true,
    votes: [
      { playerName: "Alice", vote: "aye" },
      { playerName: "Bob", vote: "aye" },
      { playerName: "Charlie", vote: "aye" },
      { playerName: "Diana", vote: "no" },
      { playerName: "Eve", vote: "no" },
    ],
  },
};

export const Failed: Story = {
  args: {
    presidentName: "Alice",
    chancellorNomineeName: "Bob",
    passed: false,
    votes: [
      { playerName: "Alice", vote: "aye" },
      { playerName: "Bob", vote: "no" },
      { playerName: "Charlie", vote: "no" },
      { playerName: "Diana", vote: "no" },
      { playerName: "Eve", vote: "no" },
    ],
  },
};
