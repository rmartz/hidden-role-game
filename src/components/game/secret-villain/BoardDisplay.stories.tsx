import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BoardDisplay } from "./BoardDisplay";
import { SvTheme } from "@/lib/game/modes/secret-villain/themes";
import { SpecialActionType } from "@/lib/game/modes/secret-villain/types";

// Medium preset (7–8 players): Investigate → Shoot → Shoot on slots 3–5
const MEDIUM_POWER_TABLE = [
  undefined,
  undefined,
  SpecialActionType.InvestigateTeam,
  SpecialActionType.Shoot,
  SpecialActionType.Shoot,
];

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
    powerTable: MEDIUM_POWER_TABLE,
  },
};

export const Empty: Story = {
  args: {
    goodCardsPlayed: 0,
    badCardsPlayed: 0,
    failedElectionCount: 0,
    failedElectionThreshold: 3,
    powerTable: MEDIUM_POWER_TABLE,
  },
};

export const NearWin: Story = {
  args: {
    goodCardsPlayed: 4,
    badCardsPlayed: 5,
    failedElectionCount: 2,
    failedElectionThreshold: 3,
    powerTable: MEDIUM_POWER_TABLE,
  },
};

export const FinalSlotFilled: Story = {
  args: {
    goodCardsPlayed: 5,
    badCardsPlayed: 6,
    failedElectionCount: 0,
    failedElectionThreshold: 3,
    powerTable: MEDIUM_POWER_TABLE,
  },
};

export const VetoUnlocked: Story = {
  args: {
    goodCardsPlayed: 2,
    badCardsPlayed: 5,
    failedElectionCount: 0,
    failedElectionThreshold: 3,
    vetoUnlocked: true,
    powerTable: MEDIUM_POWER_TABLE,
  },
};

export const HighFailedElections: Story = {
  args: {
    goodCardsPlayed: 1,
    badCardsPlayed: 2,
    failedElectionCount: 3,
    failedElectionThreshold: 3,
    powerTable: MEDIUM_POWER_TABLE,
  },
};

export const StarWarsTheme: Story = {
  args: {
    goodCardsPlayed: 3,
    badCardsPlayed: 2,
    failedElectionCount: 0,
    failedElectionThreshold: 3,
    svTheme: SvTheme.StarWars,
    powerTable: MEDIUM_POWER_TABLE,
  },
};

export const BusinessTheme: Story = {
  args: {
    goodCardsPlayed: 1,
    badCardsPlayed: 3,
    failedElectionCount: 1,
    failedElectionThreshold: 3,
    svTheme: SvTheme.Business,
    powerTable: MEDIUM_POWER_TABLE,
  },
};

// Medium preset (7–8 players): slots 3–5 have powers
export const WithPowerTable: Story = {
  args: {
    goodCardsPlayed: 1,
    badCardsPlayed: 2,
    failedElectionCount: 0,
    failedElectionThreshold: 3,
    powerTable: [
      undefined,
      undefined,
      SpecialActionType.InvestigateTeam,
      SpecialActionType.Shoot,
      SpecialActionType.Shoot,
    ],
  },
};

// Shows played (strikethrough) and upcoming power distinction
export const WithPowerTablePartiallyPlayed: Story = {
  args: {
    goodCardsPlayed: 0,
    badCardsPlayed: 3,
    failedElectionCount: 1,
    failedElectionThreshold: 3,
    powerTable: [
      undefined,
      undefined,
      SpecialActionType.InvestigateTeam,
      SpecialActionType.Shoot,
      SpecialActionType.Shoot,
    ],
  },
};
