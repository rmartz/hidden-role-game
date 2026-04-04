import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BoardDisplay } from "./BoardDisplay";

const meta = {
  component: BoardDisplay,
} satisfies Meta<typeof BoardDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    goodCardsPlayed: 2,
    badCardsPlayed: 3,
    failedElectionCount: 1,
    failedElectionThreshold: 3,
  },
};

export const Empty: Story = {
  args: {
    goodCardsPlayed: 0,
    badCardsPlayed: 0,
    failedElectionCount: 0,
    failedElectionThreshold: 3,
  },
};

export const NearWin: Story = {
  args: {
    goodCardsPlayed: 4,
    badCardsPlayed: 4,
    failedElectionCount: 2,
    failedElectionThreshold: 3,
  },
};

export const VetoUnlocked: Story = {
  args: {
    goodCardsPlayed: 2,
    badCardsPlayed: 5,
    failedElectionCount: 0,
    failedElectionThreshold: 3,
    vetoUnlocked: true,
  },
};

export const HighFailedElections: Story = {
  args: {
    goodCardsPlayed: 1,
    badCardsPlayed: 2,
    failedElectionCount: 3,
    failedElectionThreshold: 3,
  },
};
