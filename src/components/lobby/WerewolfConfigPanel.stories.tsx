import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import { WerewolfConfigPanel } from "./WerewolfConfigPanel";

const meta = {
  component: WerewolfConfigPanel,
} satisfies Meta<typeof WerewolfConfigPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    nominationEnabled: true,
    singleTrialPerDay: true,
    revealProtections: true,
    showRolesOnDeath: true,
    onWerewolfTimerConfigChange: fn(),
    onNominationEnabledChange: fn(),
    onSingleTrialPerDayChange: fn(),
    onRevealProtectionsChange: fn(),
    onShowRolesOnDeathChange: fn(),
  },
};

export const RolesHiddenOnDeath: Story = {
  args: {
    ...Default.args,
    showRolesOnDeath: false,
  },
};

export const ReadOnly: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};
