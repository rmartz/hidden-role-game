import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NightPhaseOrderList } from "./NightPhaseOrderList";

const meta = {
  component: NightPhaseOrderList,
} satisfies Meta<typeof NightPhaseOrderList>;

export default meta;
type Story = StoryObj<typeof meta>;

const roles: Record<string, { name: string }> = {
  "werewolf-seer": { name: "Seer" },
  "werewolf-werewolf": { name: "Werewolf" },
  "werewolf-bodyguard": { name: "Bodyguard" },
  "werewolf-witch": { name: "Witch" },
};

const nightPhaseOrder = [
  "werewolf-seer",
  "werewolf-werewolf",
  "werewolf-bodyguard",
  "werewolf-witch",
];

export const NoPhases: Story = {
  args: {
    nightPhaseOrder: [],
    currentPhaseIndex: 0,
    roles,
  },
};

export const AllFuturePhases: Story = {
  args: {
    nightPhaseOrder,
    currentPhaseIndex: -1,
    roles,
  },
};

export const CurrentPhaseHighlighted: Story = {
  args: {
    nightPhaseOrder,
    currentPhaseIndex: 1,
    roles,
  },
};

export const PastPhasesShown: Story = {
  args: {
    nightPhaseOrder,
    currentPhaseIndex: 3,
    roles,
  },
};
