import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GameMode, Team } from "@/lib/types";

import { PlayerRoleDisplay } from "./PlayerRoleDisplay";

const meta = {
  title: "components/game/werewolf/PlayerRoleDisplay",
  component: PlayerRoleDisplay,
} satisfies Meta<typeof PlayerRoleDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GoodTeamRole: Story = {
  args: {
    role: { id: "werewolf-seer", name: "Seer", team: Team.Good },
    gameMode: GameMode.Werewolf,
  },
};

export const BadTeamRole: Story = {
  args: {
    role: { id: "werewolf-werewolf", name: "Werewolf", team: Team.Bad },
    gameMode: GameMode.Werewolf,
  },
};

export const NeutralTeamRole: Story = {
  args: {
    role: { id: "werewolf-tanner", name: "Tanner", team: Team.Neutral },
    gameMode: GameMode.Werewolf,
  },
};
