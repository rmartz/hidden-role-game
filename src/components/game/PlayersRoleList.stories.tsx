import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayersRoleList } from "./PlayersRoleList";
import { GameMode, Team } from "@/lib/types";
import type { VisibleTeammate } from "@/server/types";

const meta = {
  component: PlayersRoleList,
} satisfies Meta<typeof PlayersRoleList>;

export default meta;
type Story = StoryObj<typeof meta>;

const wakePartnerAssignments: VisibleTeammate[] = [
  {
    player: { id: "p1", name: "Alice" },
    reason: "wake-partner",
    role: undefined,
  },
  {
    player: { id: "p2", name: "Bob" },
    reason: "wake-partner",
    role: undefined,
  },
];

const awareOfAssignments: VisibleTeammate[] = [
  {
    player: { id: "p3", name: "Charlie" },
    reason: "aware-of",
    role: undefined,
  },
];

const revealedAssignments: VisibleTeammate[] = [
  {
    player: { id: "p4", name: "Diana" },
    reason: "revealed",
    role: { id: "werewolf-seer", name: "Seer", team: Team.Good },
  },
  {
    player: { id: "p5", name: "Eve" },
    reason: "revealed",
    role: { id: "werewolf-werewolf", name: "Werewolf", team: Team.Bad },
  },
];

export const Default: Story = {
  args: {
    assignments: [...wakePartnerAssignments, ...awareOfAssignments],
    gameMode: GameMode.Werewolf,
    myRoleId: "werewolf-werewolf",
  },
};

export const EmptyVisibility: Story = {
  args: {
    assignments: [],
    gameMode: GameMode.Werewolf,
    myRoleId: "werewolf-villager",
  },
};

export const WithRoleReveals: Story = {
  args: {
    assignments: [
      ...wakePartnerAssignments,
      ...awareOfAssignments,
      ...revealedAssignments,
    ],
    gameMode: GameMode.Werewolf,
    deadPlayerIds: ["p4", "p5"],
    myRoleId: "werewolf-werewolf",
  },
};
