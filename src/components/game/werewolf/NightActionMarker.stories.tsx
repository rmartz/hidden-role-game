import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NightActionMarker, NightMarkerEffect } from "./NightActionMarker";

const meta = {
  component: NightActionMarker,
} satisfies Meta<typeof NightActionMarker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Attacked: Story = {
  args: { effect: NightMarkerEffect.Attacked },
};

export const Protected: Story = {
  args: { effect: NightMarkerEffect.Protected },
};

export const Silenced: Story = {
  args: { effect: NightMarkerEffect.Silenced },
};

export const Hypnotized: Story = {
  args: { effect: NightMarkerEffect.Hypnotized },
};

export const Investigated: Story = {
  args: { effect: NightMarkerEffect.Investigated },
};

export const Special: Story = {
  args: { effect: NightMarkerEffect.Special },
};
