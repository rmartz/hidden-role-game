import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LobbyLayout } from "./LobbyLayout";

const meta = {
  component: LobbyLayout,
} satisfies Meta<typeof LobbyLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <p>Lobby content goes here</p>,
  },
};
