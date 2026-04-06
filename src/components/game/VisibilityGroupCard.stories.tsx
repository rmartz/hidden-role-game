import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VisibilityGroupCard } from "./VisibilityGroupCard";
import { GameMode, Team } from "@/lib/types";
import type { VisibleTeammate } from "@/server/types";
import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";

const meta = {
  component: VisibilityGroupCard,
} satisfies Meta<typeof VisibilityGroupCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const wakePartnerEntries: VisibleTeammate[] = [
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

const awareOfEntries: VisibleTeammate[] = [
  {
    player: { id: "p3", name: "Charlie" },
    reason: "aware-of",
    role: undefined,
  },
  { player: { id: "p4", name: "Diana" }, reason: "aware-of", role: undefined },
];

const revealedEntries: VisibleTeammate[] = [
  {
    player: { id: "p5", name: "Eve" },
    reason: "revealed",
    role: { id: "werewolf-seer", name: "Seer", team: Team.Good },
  },
];

export const WakePartnerWerewolf: Story = {
  args: {
    reason: "wake-partner",
    entries: wakePartnerEntries,
    gameMode: GameMode.Werewolf,
    myRoleId: WerewolfRole.Werewolf,
  },
};

export const WakePartnerWithLoneWolfWarning: Story = {
  args: {
    reason: "wake-partner",
    entries: wakePartnerEntries,
    gameMode: GameMode.Werewolf,
    myRoleId: WerewolfRole.Werewolf,
    rolesInPlay: [{ id: WerewolfRole.Werewolf }, { id: WerewolfRole.LoneWolf }],
  },
};

export const AwareOf: Story = {
  args: {
    reason: "aware-of",
    entries: awareOfEntries,
    gameMode: GameMode.Werewolf,
    myRoleId: WerewolfRole.Mason,
  },
};

export const Revealed: Story = {
  args: {
    reason: "revealed",
    entries: revealedEntries,
    gameMode: GameMode.Werewolf,
  },
};

export const WithExecutionerTarget: Story = {
  args: {
    reason: "aware-of",
    entries: awareOfEntries,
    gameMode: GameMode.Werewolf,
    myRoleId: WerewolfRole.Executioner,
    executionerTargetId: "p3",
  },
};

export const WithActions: Story = {
  args: {
    reason: "wake-partner",
    entries: wakePartnerEntries,
    gameMode: GameMode.Werewolf,
    myRoleId: WerewolfRole.Werewolf,
    renderActions: (_playerId, playerName) => (
      <button className="text-xs text-blue-500">Select {playerName}</button>
    ),
  },
};
