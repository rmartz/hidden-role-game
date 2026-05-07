import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import { WerewolfConfigPanel } from "./WerewolfConfigPanel";
import { WEREWOLF_CONFIG_PANEL_COPY } from "./WerewolfConfigPanel.copy";

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
  autoRevealNightOutcome: true,
  onWerewolfTimerConfigChange: fn(),
  onNominationEnabledChange: fn(),
  onTrialsPerDayChange: fn(),
  onRevealProtectionsChange: fn(),
  onShowRolesOnDeathChange: fn(),
  onAutoRevealNightOutcomeChange: fn(),
} as Story["args"];

export const Default: Story = {
  args: DEFAULT_ARGS,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const nominationSwitch = canvas.getByRole("switch", {
      name: WEREWOLF_CONFIG_PANEL_COPY.nominationEnabled,
    });
    await expect(nominationSwitch).toBeDefined();

    await userEvent.click(nominationSwitch);
    await expect(args.onNominationEnabledChange).toHaveBeenCalled();
  },
};

export const RolesHiddenOnDeath: Story = {
  args: {
    ...DEFAULT_ARGS,
    showRolesOnDeath: false,
  },
};

export const ManualRevealNightOutcomes: Story = {
  args: {
    ...DEFAULT_ARGS,
    autoRevealNightOutcome: false,
  },
};

export const ReadOnly: Story = {
  args: {
    ...DEFAULT_ARGS,
    disabled: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const nominationSwitch = canvas.getByRole("switch", {
      name: WEREWOLF_CONFIG_PANEL_COPY.nominationEnabled,
    });
    await userEvent.click(nominationSwitch);
    await expect(args.onNominationEnabledChange).not.toHaveBeenCalled();
  },
};
