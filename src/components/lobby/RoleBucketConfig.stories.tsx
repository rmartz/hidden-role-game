import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { RoleBucketConfigView } from "./RoleBucketConfig";
import { GameMode, Team } from "@/lib/types";
import type { AdvancedRoleBucket, RoleDefinition } from "@/lib/types";

const mockRoles: RoleDefinition<string, Team>[] = [
  { id: "villager", name: "Villager", team: Team.Good },
  { id: "werewolf", name: "Werewolf", team: Team.Bad },
  { id: "seer", name: "Seer", team: Team.Good },
  { id: "doctor", name: "Doctor", team: Team.Good },
];

const emptyBucket: AdvancedRoleBucket = {
  playerCount: 2,
  roles: [],
};

const populatedBuckets: AdvancedRoleBucket[] = [
  {
    playerCount: 3,
    name: "Village",
    roles: [{ roleId: "villager" }, { roleId: "seer", max: 1 }],
  },
  {
    playerCount: 1,
    name: "Wolves",
    roles: [{ roleId: "werewolf", max: 1 }],
  },
];

const meta = {
  component: RoleBucketConfigView,
  args: {
    gameMode: GameMode.Werewolf,
    allRoles: mockRoles,
    disabled: false,
    onAddBucket: fn(),
    onRemoveBucket: fn(),
    onSetBucketName: fn(),
    onSetBucketPlayerCount: fn(),
    onAddRole: fn(),
    onRemoveRole: fn(),
    onSetUnique: fn(),
  },
} satisfies Meta<typeof RoleBucketConfigView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    buckets: [],
  },
};

export const EmptyBucket: Story = {
  args: {
    buckets: [emptyBucket],
  },
};

export const WithBuckets: Story = {
  args: {
    buckets: populatedBuckets,
  },
};

export const Disabled: Story = {
  args: {
    buckets: populatedBuckets,
    disabled: true,
  },
};

export const UnnamedBuckets: Story = {
  args: {
    buckets: [
      { playerCount: 2, roles: [{ roleId: "villager" }] },
      { playerCount: 1, roles: [{ roleId: "werewolf", max: 1 }] },
    ],
  },
};
