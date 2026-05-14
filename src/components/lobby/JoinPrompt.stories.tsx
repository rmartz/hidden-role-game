import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { JoinPromptView } from "./JoinPrompt";

const meta = {
  component: JoinPromptView,
  args: {
    onPlayerNameChange: fn(),
    onSubmit: fn(),
  },
} satisfies Meta<typeof JoinPromptView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    playerName: "",
    isSubmitting: false,
    error: undefined,
    playerCount: undefined,
  },
};

export const WithPlayerCount: Story = {
  args: {
    playerName: "",
    isSubmitting: false,
    error: undefined,
    playerCount: 4,
  },
};

export const WithError: Story = {
  args: {
    playerName: "Alice",
    isSubmitting: false,
    error: "Error: Lobby is full",
    playerCount: 8,
  },
};

export const Submitting: Story = {
  args: {
    playerName: "Alice",
    isSubmitting: true,
    error: undefined,
    playerCount: 4,
  },
};
