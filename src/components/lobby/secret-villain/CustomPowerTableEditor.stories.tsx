import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { SpecialActionType } from "@/lib/game-modes/secret-villain/types";
import { CustomPowerTableEditor } from "./CustomPowerTableEditor";

const meta = {
  component: CustomPowerTableEditor,
} satisfies Meta<typeof CustomPowerTableEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    powerTable: [undefined, undefined, undefined],
    onChange: fn(),
  },
};

export const Configured: Story = {
  args: {
    powerTable: [
      SpecialActionType.InvestigateTeam,
      SpecialActionType.PolicyPeek,
      SpecialActionType.SpecialElection,
    ],
    onChange: fn(),
  },
};

export const Disabled: Story = {
  args: {
    powerTable: [
      SpecialActionType.InvestigateTeam,
      undefined,
      SpecialActionType.PolicyPeek,
    ],
    disabled: true,
  },
};
