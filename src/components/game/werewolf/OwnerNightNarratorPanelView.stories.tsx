import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { OwnerNightNarratorPanelView } from "./OwnerNightNarratorPanelView";

const meta: Meta<typeof OwnerNightNarratorPanelView> = {
  title: "Werewolf/OwnerNightNarratorPanelView",
  component: OwnerNightNarratorPanelView,
  parameters: {
    layout: "padded",
  },
  args: {
    gameId: "game-1",
    activePhaseKey: "seer",
    activePhaseLabel: "Seer",
    activePlayerNames: ["Alice"],
    isFirstTurn: false,
    isWitchAbilitySkipped: false,
    activeTargetConfirmed: false,
    abilityBypass: false,
    onRestoreWitchAbility: fn(),
    onBypassWitchAbility: fn(),
    isVeteranPhase: false,
    veteranAlertsUsed: 0,
    isVeteranAlerted: false,
    veteranHasDecided: false,
    isActionConfirmed: false,
    onVeteranAlert: fn(),
    onVeteranSkip: fn(),
    onVeteranConfirm: fn(),
    isEvilEmpathPhase: false,
    hasGroupAction: false,
    groupMemberCount: 1,
    resolvedVotes: [],
    targetablePlayers: [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
      { id: "p3", name: "Charlie" },
    ],
    onTargetClick: fn(),
    requiresDualTarget: false,
    isResultRevealed: false,
    isIlluminatiPhase: false,
    illuminatiPlayers: [],
    illuminatiRoleAssignments: [],
    isIlluminatiRevealed: false,
    isPending: false,
  },
};

export default meta;
type Story = StoryObj<typeof OwnerNightNarratorPanelView>;

export const TargetSelection: Story = {};

export const FirstTurnInstruction: Story = {
  args: {
    isFirstTurn: true,
    narratorInstruction: {
      wakeInstruction: "Tell Seer to open their eyes.",
      postWake: "Tell them to look at the Narrator.",
    },
  },
};

export const VeteranPhase: Story = {
  args: {
    activePhaseKey: "veteran",
    activePhaseLabel: "Veteran",
    isVeteranPhase: true,
    veteranAlertsUsed: 1,
  },
};

export const WitchAbilitySkipped: Story = {
  args: {
    activePhaseKey: "witch",
    activePhaseLabel: "Witch",
    isWitchAbilitySkipped: true,
  },
};

export const EvilEmpathResult: Story = {
  args: {
    activePhaseKey: "evil-empath",
    activePhaseLabel: "Evil Empath",
    isEvilEmpathPhase: true,
    evilEmpathNightResult: true,
  },
};
