import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { SpecialActionView } from "./SpecialActionView";

const players = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
];

const meta = {
  component: SpecialActionView,
  args: {
    onSelectPlayer: fn(),
    onConfirm: fn(),
    onConsent: fn(),
    players,
    presidentName: "Alice",
  },
} satisfies Meta<typeof SpecialActionView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InvestigateSelectTarget: Story = {
  args: {
    actionType: "investigate-team",
    isPresident: true,
  },
};

export const InvestigateResult: Story = {
  args: {
    actionType: "investigate-team",
    isPresident: true,
    investigationResult: { targetPlayerId: "p2", team: "bad" },
  },
};

export const SpecialElection: Story = {
  args: {
    actionType: "special-election",
    isPresident: true,
  },
};

export const Shoot: Story = {
  args: {
    actionType: "shoot",
    isPresident: true,
  },
};

export const PolicyPeek: Story = {
  args: {
    actionType: "policy-peek",
    isPresident: true,
    peekedCards: ["bad", "good", "bad"],
  },
};

export const NonPresidentWaiting: Story = {
  args: {
    actionType: "shoot",
    isPresident: false,
  },
};

export const InvestigationConsent: Story = {
  args: {
    actionType: "investigate-team",
    isPresident: false,
    investigationConsent: true,
  },
};
