import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameRolesList } from "./GameRolesList";
import { GameMode, Team } from "@/lib/types";
import type { RoleInPlay } from "@/server/types";

const meta = {
  component: GameRolesList,
} satisfies Meta<typeof GameRolesList>;

export default meta;
type Story = StoryObj<typeof meta>;

const rolesInPlay: RoleInPlay[] = [
  {
    id: "werewolf-werewolf",
    name: "Werewolf",
    team: Team.Bad,
    min: 2,
    max: 2,
    count: 2,
  },
  {
    id: "werewolf-villager",
    name: "Villager",
    team: Team.Good,
    min: 3,
    max: 3,
    count: 3,
  },
  {
    id: "werewolf-seer",
    name: "Seer",
    team: Team.Good,
    min: 1,
    max: 1,
    count: 1,
  },
  {
    id: "werewolf-bodyguard",
    name: "Bodyguard",
    team: Team.Good,
    min: 1,
    max: 1,
    count: 1,
  },
  {
    id: "werewolf-tanner",
    name: "Tanner",
    team: Team.Neutral,
    min: 0,
    max: 1,
  },
];

export const WithRolesInPlay: Story = {
  args: {
    roles: rolesInPlay,
    gameMode: GameMode.Werewolf,
  },
};

export const Empty: Story = {
  args: {
    roles: [],
    gameMode: GameMode.Werewolf,
  },
};
