import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import { WerewolfConfigPanel } from "./WerewolfConfigPanel";

const meta = {
  component: WerewolfConfigPanel,
} satisfies Meta<typeof WerewolfConfigPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const DEFAULT_ARGS = {
  timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  nominationEnabled: true,
  trialsPerDay: 1,
  revealProtections: true,
  showRolesOnDeath: true,
  hiddenRole: false,
  onWerewolfTimerConfigChange: fn(),
  onNominationEnabledChange: fn(),
  onTrialsPerDayChange: fn(),
  onRevealProtectionsChange: fn(),
  onShowRolesOnDeathChange: fn(),
} as Story["args"];

export const Default: Story = {
  args: DEFAULT_ARGS,
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
