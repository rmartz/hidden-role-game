import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ElectionVoteView } from "./ElectionVoteView";

const meta = {
  component: ElectionVoteView,
  args: {
    onVote: fn(),
  },
} satisfies Meta<typeof ElectionVoteView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotVoted: Story = {
  args: {
    presidentName: "Alice",
    chancellorNomineeName: "Bob",
  },
};

export const VotedYes: Story = {
  args: {
    presidentName: "Alice",
    chancellorNomineeName: "Bob",
    myVote: "yes",
  },
};

export const VotedNo: Story = {
  args: {
    presidentName: "Alice",
    chancellorNomineeName: "Bob",
    myVote: "no",
  },
};

export const Eliminated: Story = {
  args: {
    presidentName: "Alice",
    chancellorNomineeName: "Bob",
    isEliminated: true,
  },
};
