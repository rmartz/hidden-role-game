import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WerewolfRole } from "@/lib/game/modes/werewolf";

import { NightOutcomeSummary } from "./NightOutcomeSummary";

const meta = {
  title: "components/game/werewolf/NightOutcomeSummary",
  component: NightOutcomeSummary,
  args: {
    players: [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
      { id: "p3", name: "Charlie" },
    ],
    roles: {
      [WerewolfRole.Werewolf]: { name: "Werewolf" },
      [WerewolfRole.Spellcaster]: { name: "Spellcaster" },
    },
  },
} satisfies Meta<typeof NightOutcomeSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CombinedKnightedAndAttacked: Story = {
  args: {
    events: [
      {
        type: "killed",
        targetPlayerId: "p2",
        attackedBy: [WerewolfRole.Werewolf],
        protectedBy: [],
        died: true,
      },
    ],
    knightedPlayerId: "p2",
  },
};
