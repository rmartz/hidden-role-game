import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { SpecialActionView } from "./SpecialActionView";
import { SpecialActionType } from "@/lib/game-modes/secret-villain/types";

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
    actionType: SpecialActionType.InvestigateTeam,
    isPresident: true,
  },
};

export const InvestigateResult: Story = {
  args: {
    actionType: SpecialActionType.InvestigateTeam,
    isPresident: true,
    investigationResult: { targetPlayerId: "p2", team: "bad" },
  },
};

export const SpecialElection: Story = {
  args: {
    actionType: SpecialActionType.SpecialElection,
    isPresident: true,
  },
};

export const Shoot: Story = {
  args: {
    actionType: SpecialActionType.Shoot,
    isPresident: true,
  },
};

export const PolicyPeek: Story = {
  args: {
    actionType: SpecialActionType.PolicyPeek,
    isPresident: true,
    peekedCards: ["bad", "good", "bad"],
  },
};

export const NonPresidentWaiting: Story = {
  args: {
    actionType: SpecialActionType.Shoot,
    isPresident: false,
  },
};

export const InvestigationConsent: Story = {
  args: {
    actionType: SpecialActionType.InvestigateTeam,
    isPresident: false,
    investigationConsent: true,
  },
};
