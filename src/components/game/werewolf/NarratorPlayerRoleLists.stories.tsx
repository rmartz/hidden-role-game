import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { GameMode, Team } from "@/lib/types";
import type { VisibleTeammate } from "@/server/types";

import { NarratorPlayerRoleLists } from "./NarratorPlayerRoleLists";
import { NightMarkerEffect } from "./NightActionMarker";

const meta = {
  component: NarratorPlayerRoleLists,
} satisfies Meta<typeof NarratorPlayerRoleLists>;

export default meta;
type Story = StoryObj<typeof meta>;

const assignments: VisibleTeammate[] = [
  {
    player: { id: "p1", name: "Alice" },
    reason: "revealed",
    role: { id: "werewolf-seer", name: "Seer", team: Team.Good },
  },
  {
    player: { id: "p2", name: "Bob" },
    reason: "revealed",
    role: { id: "werewolf-werewolf", name: "Werewolf", team: Team.Bad },
  },
  {
    player: { id: "p3", name: "Charlie" },
    reason: "revealed",
    role: { id: "werewolf-doctor", name: "Doctor", team: Team.Good },
  },
  {
    player: { id: "p4", name: "Diana" },
    reason: "revealed",
    role: { id: "werewolf-spellcaster", name: "Spellcaster", team: Team.Good },
  },
  {
    player: { id: "p5", name: "Eve" },
    reason: "revealed",
    role: { id: "werewolf-villager", name: "Villager", team: Team.Good },
  },
];

export const NoMarkers: Story = {
  args: {
    assignments,
    gameMode: GameMode.Werewolf,
  },
};

export const WithNightMarkers: Story = {
  args: {
    assignments,
    gameMode: GameMode.Werewolf,
    nightStatusMarkers: new Map([
      ["p1", [NightMarkerEffect.Investigated]],
      ["p2", [NightMarkerEffect.Attacked]],
      ["p3", [NightMarkerEffect.Protected]],
      ["p4", [NightMarkerEffect.Silenced]],
      ["p5", [NightMarkerEffect.Hypnotized]],
    ]),
  },
};

export const AttackedAndProtected: Story = {
  args: {
    assignments,
    gameMode: GameMode.Werewolf,
    nightStatusMarkers: new Map([
      ["p1", [NightMarkerEffect.Attacked, NightMarkerEffect.Protected]],
    ]),
  },
};

export const WithEliminatedPlayers: Story = {
  args: {
    assignments,
    gameMode: GameMode.Werewolf,
    deadPlayerIds: ["p2"],
    nightStatusMarkers: new Map([
      ["p1", [NightMarkerEffect.Attacked]],
      ["p3", [NightMarkerEffect.Protected]],
    ]),
  },
};
