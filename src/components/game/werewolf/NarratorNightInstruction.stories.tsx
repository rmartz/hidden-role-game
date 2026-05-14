import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NarratorNightInstruction } from "./NarratorNightInstruction";

const meta: Meta<typeof NarratorNightInstruction> = {
  title: "Werewolf/NarratorNightInstruction",
  component: NarratorNightInstruction,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof NarratorNightInstruction>;

export const WerewolfPhase: Story = {
  args: {
    instruction: {
      wakeInstruction: "Tell all Werewolves to open their eyes.",
      postWake: "Tell them to find their teammates and choose a target.",
    },
  },
};

export const MinionWithExtraWerewolves: Story = {
  args: {
    instruction: {
      preWake:
        "All Werewolves, including Wolf Cub, Lone Wolf, raise your thumbs.",
      wakeInstruction: "Tell Minion to open their eyes.",
      postWake: "Tell them to look around, then close their eyes.",
    },
  },
};

export const MinionBasic: Story = {
  args: {
    instruction: {
      preWake: "All Werewolves, raise your thumbs.",
      wakeInstruction: "Tell Minion to open their eyes.",
      postWake: "Tell them to look around, then close their eyes.",
    },
  },
};

export const SentinelWithSeer: Story = {
  args: {
    instruction: {
      preWake: "Tell the Seer to raise their thumb.",
      wakeInstruction: "Tell Sentinel to open their eyes.",
      postWake: "Tell them to look around, then close their eyes.",
    },
  },
};

export const SentinelWithoutSeer: Story = {
  args: {
    instruction: {
      wakeInstruction: "Tell Sentinel to open their eyes.",
      postWake: "Tell them to look around, then close their eyes.",
    },
  },
};

export const Masons: Story = {
  args: {
    instruction: {
      wakeInstruction: "Tell all Masons to open their eyes.",
      postWake: "Tell them to find each other.",
    },
  },
};

export const SeerWithActivity: Story = {
  args: {
    instruction: {
      wakeInstruction: "Tell Seer to open their eyes.",
      postWake: "Tell them to look at the Narrator.",
    },
  },
};

export const ElusiveSeerNoActivity: Story = {
  args: {
    instruction: {
      wakeInstruction: "Tell Elusive Seer to open their eyes.",
    },
  },
};
