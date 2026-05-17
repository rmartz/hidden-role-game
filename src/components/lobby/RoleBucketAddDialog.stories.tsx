import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { RoleDefinition } from "@/lib/types";
import { GameMode, Team } from "@/lib/types";

import { RoleBucketAddDialogView } from "./RoleBucketAddDialog";

const mockRoles: RoleDefinition<string, Team>[] = [
  {
    id: "villager",
    name: "Villager",
    team: Team.Good,
    category: "villager-support",
    description: "No night action.",
  },
  {
    id: "seer",
    name: "Seer",
    team: Team.Good,
    category: "villager-investigation",
    description: "Investigate one player each night.",
  },
  {
    id: "werewolf",
    name: "Werewolf",
    team: Team.Bad,
    category: "evil-killing",
    description: "Vote with werewolves to eliminate a player.",
  },
];

const categorizedRoles = [
  {
    category: "evil-killing",
    label: "Werewolf — Killing",
    roles: [mockRoles[2]],
  },
  {
    category: "villager-investigation",
    label: "Villager — Investigation",
    roles: [mockRoles[1]],
  },
  {
    category: "villager-support",
    label: "Villager — Support",
    roles: [mockRoles[0]],
  },
];

const meta = {
  component: RoleBucketAddDialogView,
  args: {
    open: true,
    gameMode: GameMode.Werewolf,
    disabled: false,
    onOpenChange: fn(),
    categorizedRoles,
    uncategorizedRoles: [],
    hasCategoryGrouping: true,
    assignedRoleIds: new Set<string>(),
    onAddRole: fn(),
  },
} satisfies Meta<typeof RoleBucketAddDialogView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyBucket: Story = {};

export const PartialBucket: Story = {
  args: {
    assignedRoleIds: new Set<string>(["seer"]),
  },
};

export const FullBucket: Story = {
  args: {
    assignedRoleIds: new Set<string>(["villager", "seer", "werewolf"]),
  },
};
