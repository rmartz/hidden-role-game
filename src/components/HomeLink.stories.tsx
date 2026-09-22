import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomeLink } from "./HomeLink";

const meta = {
  component: HomeLink,
} satisfies Meta<typeof HomeLink>;

export default meta;
type Story = StoryObj<typeof meta>;

// TEMPORARY (revert before merge): touched to make the colocation resolver
// pick up a story, so PR #907 exercises the storybook-ci capture path
// end-to-end — PAT auth, gh --attach upload, and the gallery comment.
export const Default: Story = {};
