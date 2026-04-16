import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { PlayerTargetSelectionView } from "./PlayerTargetSelection";
import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";

const meta = {
  component: PlayerTargetSelectionView,
  args: {
    onMutate: fn(),
    onConfirm: fn(),
    isPending: false,
    isConfirmed: false,
    isGroupPhase: false,
    hasTarget: false,
    allAgreed: false,
    players: [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
      { id: "p3", name: "Carol" },
    ],
  },
} satisfies Meta<typeof PlayerTargetSelectionView>;

export default meta;
type Story = StoryObj<typeof meta>;

const TARGETS = [
  [{ id: "p1", name: "Alice" }, false],
  [{ id: "p2", name: "Bob" }, false],
  [{ id: "p3", name: "Carol" }, false],
] as const;

export const NoSelection: Story = {
  args: {
    targets: TARGETS,
    confirmPhaseKey: WerewolfRole.Seer,
  },
};

export const FirstTargetSelected: Story = {
  args: {
    targets: [
      [{ id: "p1", name: "Alice" }, false],
      [{ id: "p2", name: "Bob" }, true],
      [{ id: "p3", name: "Carol" }, false],
    ],
    myNightTarget: "p2",
    hasTarget: true,
    confirmPhaseKey: WerewolfRole.Seer,
  },
};

export const SkipSelected: Story = {
  args: {
    targets: TARGETS,
    myNightTarget: null,
    hasTarget: false,
    confirmPhaseKey: WerewolfRole.Seer,
  },
};

export const Confirmed: Story = {
  args: {
    targets: [
      [{ id: "p1", name: "Alice" }, false],
      [{ id: "p2", name: "Bob" }, true],
      [{ id: "p3", name: "Carol" }, false],
    ],
    myNightTarget: "p2",
    hasTarget: true,
    isConfirmed: true,
    confirmPhaseKey: WerewolfRole.Seer,
  },
};

export const ConfirmedNoAction: Story = {
  args: {
    targets: TARGETS,
    myNightTarget: null,
    hasTarget: false,
    isConfirmed: true,
    confirmPhaseKey: WerewolfRole.Seer,
  },
};

export const MentalistFirstTargetSelected: Story = {
  args: {
    targets: [
      [{ id: "p1", name: "Alice" }, true],
      [{ id: "p2", name: "Bob" }, false],
      [{ id: "p3", name: "Carol" }, false],
    ],
    myNightTarget: "p1",
    hasTarget: true,
    requiresSecondTarget: true,
    confirmPhaseKey: WerewolfRole.Mentalist,
  },
};

export const MentalistBothTargetsSelected: Story = {
  args: {
    targets: [
      [{ id: "p1", name: "Alice" }, true],
      [{ id: "p2", name: "Bob" }, false],
      [{ id: "p3", name: "Carol" }, false],
    ],
    myNightTarget: "p1",
    mySecondNightTarget: "p3",
    hasTarget: true,
    requiresSecondTarget: true,
    confirmPhaseKey: WerewolfRole.Mentalist,
  },
};

export const MentalistConfirmed: Story = {
  args: {
    targets: [
      [{ id: "p1", name: "Alice" }, true],
      [{ id: "p2", name: "Bob" }, false],
      [{ id: "p3", name: "Carol" }, false],
    ],
    myNightTarget: "p1",
    mySecondNightTarget: "p3",
    hasTarget: true,
    requiresSecondTarget: true,
    isConfirmed: true,
    confirmPhaseKey: WerewolfRole.Mentalist,
  },
};
