import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { GameMode } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game-modes/secret-villain/timer-config";
import {
  SvBoardPreset,
  SpecialActionType,
} from "@/lib/game-modes/secret-villain/types";
import { SecretVillainConfigPanel } from "./SecretVillainConfigPanel";

const meta = {
  component: SecretVillainConfigPanel,
} satisfies Meta<typeof SecretVillainConfigPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    modeConfig: { gameMode: GameMode.SecretVillain },
    onTimerConfigChange: fn(),
    onModeConfigFieldChange: fn(),
  },
};

export const WithBoardPreset: Story = {
  args: {
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    modeConfig: {
      gameMode: GameMode.SecretVillain,
      boardPreset: SvBoardPreset.Large,
    },
    onTimerConfigChange: fn(),
    onModeConfigFieldChange: fn(),
  },
};

export const WithCustomPreset: Story = {
  args: {
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    modeConfig: {
      gameMode: GameMode.SecretVillain,
      boardPreset: SvBoardPreset.Custom,
      customPowerTable: [
        SpecialActionType.InvestigateTeam,
        SpecialActionType.PolicyPeek,
        SpecialActionType.SpecialElection,
      ],
    },
    onTimerConfigChange: fn(),
    onModeConfigFieldChange: fn(),
  },
};

export const ReadOnly: Story = {
  args: {
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    modeConfig: {
      gameMode: GameMode.SecretVillain,
      boardPreset: SvBoardPreset.Medium,
    },
    disabled: true,
  },
};
