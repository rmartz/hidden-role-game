import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { InvestigationConsentView } from "./InvestigationConsentView";

const meta = {
  component: InvestigationConsentView,
  args: {
    presidentName: "Alice",
    onConsent: fn(),
  },
} satisfies Meta<typeof InvestigationConsentView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = {
  args: {
    isPending: true,
  },
};
