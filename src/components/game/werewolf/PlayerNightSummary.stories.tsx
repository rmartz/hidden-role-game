import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerNightSummary } from "./PlayerNightSummary";
import type { DaytimeNightStatusEntry } from "@/server/types";
import type { PublicLobbyPlayer } from "@/server/types";

const meta = {
  component: PlayerNightSummary,
} satisfies Meta<typeof PlayerNightSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

const players: PublicLobbyPlayer[] = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
  { id: "p4", name: "Diana" },
  { id: "p5", name: "Eve" },
];

export const PlayerKilled: Story = {
  args: {
    players,
    nightStatus: [
      { targetPlayerId: "p2", effect: "killed" },
    ] satisfies DaytimeNightStatusEntry[],
  },
};

export const PlayerProtected: Story = {
  args: {
    players,
    nightStatus: [
      { targetPlayerId: "p3", effect: "protected" },
    ] satisfies DaytimeNightStatusEntry[],
  },
};

export const AltruistSacrifice: Story = {
  args: {
    players,
    nightStatus: [
      {
        targetPlayerId: "p4",
        effect: "altruist-sacrifice",
        savedPlayerId: "p2",
      },
    ] satisfies DaytimeNightStatusEntry[],
  },
};

export const ToughGuySurvived: Story = {
  args: {
    players,
    nightStatus: [
      { targetPlayerId: "p1", effect: "survived" },
    ] satisfies DaytimeNightStatusEntry[],
    myPlayerId: "p1",
  },
};

export const MultipleEffects: Story = {
  args: {
    players,
    nightStatus: [
      { targetPlayerId: "p2", effect: "killed" },
      { targetPlayerId: "p3", effect: "protected" },
      { targetPlayerId: "p5", effect: "silenced" },
    ] satisfies DaytimeNightStatusEntry[],
  },
};

export const NoEvents: Story = {
  args: {
    players,
    nightStatus: [],
  },
};
