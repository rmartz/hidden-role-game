import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WerewolfRole } from "@/lib/game/modes/werewolf";

import { NightOutcomeSummaryItem } from "./NightOutcomeSummaryItem";

const meta = {
  component: NightOutcomeSummaryItem,
  args: {
    playerName: "Alice",
    roles: {
      [WerewolfRole.Werewolf]: { name: "Werewolf" },
    },
  },
} satisfies Meta<typeof NightOutcomeSummaryItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    events: [],
  },
};

export const WithHangover: Story = {
  args: {
    events: [{ type: "hangover", targetPlayerId: "p1" }],
  },
};

export const Killed: Story = {
  args: {
    events: [
      {
        type: "killed",
        targetPlayerId: "p1",
        attackedBy: [WerewolfRole.Werewolf],
        protectedBy: [],
        died: true,
      },
    ],
  },
};

export const Survived: Story = {
  args: {
    events: [
      {
        type: "killed",
        targetPlayerId: "p1",
        attackedBy: [WerewolfRole.Werewolf],
        protectedBy: [WerewolfRole.Bodyguard],
        died: false,
      },
    ],
  },
};

export const Silenced: Story = {
  args: {
    events: [{ type: "silenced", targetPlayerId: "p1" }],
  },
};
