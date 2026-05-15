import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomeLink } from "./HomeLink";

const meta = {
  component: HomeLink,
} satisfies Meta<typeof HomeLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
