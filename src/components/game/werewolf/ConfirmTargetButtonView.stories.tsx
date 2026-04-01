import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConfirmTargetButtonView } from "./ConfirmTargetButtonView";
import { WerewolfRole } from "@/lib/game-modes/werewolf/roles";
import { fn } from "storybook/test";

const meta = {
  component: ConfirmTargetButtonView,
  args: {
    onConfirm: fn(),
  },
} satisfies Meta<typeof ConfirmTargetButtonView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoSelection: Story = {
  args: {
    hasTarget: false,
    hasDecided: false,
    isConfirmed: false,
  },
};

export const HasTarget: Story = {
  args: {
    hasTarget: true,
    hasDecided: true,
    isConfirmed: false,
    roleId: WerewolfRole.Seer,
  },
};

export const SkipTarget: Story = {
  args: {
    hasTarget: false,
    hasDecided: true,
    isConfirmed: false,
  },
};

export const Confirmed: Story = {
  args: {
    hasTarget: true,
    hasDecided: true,
    isConfirmed: true,
  },
};

export const GroupNeedsConsensus: Story = {
  args: {
    hasTarget: true,
    hasDecided: true,
    isConfirmed: false,
    isGroupPhase: true,
    hasGroupMembers: true,
    allAgreed: false,
    roleId: WerewolfRole.Werewolf,
  },
};

export const GroupAgreed: Story = {
  args: {
    hasTarget: true,
    hasDecided: true,
    isConfirmed: false,
    isGroupPhase: true,
    hasGroupMembers: true,
    allAgreed: true,
    roleId: WerewolfRole.Werewolf,
  },
};

export const MirrorcasterProtect: Story = {
  args: {
    hasTarget: true,
    hasDecided: true,
    isConfirmed: false,
    roleId: WerewolfRole.Mirrorcaster,
    mirrorcasterCharged: false,
  },
};

export const MirrorcasterAttack: Story = {
  args: {
    hasTarget: true,
    hasDecided: true,
    isConfirmed: false,
    roleId: WerewolfRole.Mirrorcaster,
    mirrorcasterCharged: true,
  },
};

export const Pending: Story = {
  args: {
    hasTarget: true,
    hasDecided: true,
    isConfirmed: false,
    isPending: true,
  },
};
