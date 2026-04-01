import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ShareLobby } from "./ShareLobby";

const meta = {
  component: ShareLobby,
} satisfies Meta<typeof ShareLobby>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    lobbyId: "abc123",
    gameMode: "werewolf",
  },
};
