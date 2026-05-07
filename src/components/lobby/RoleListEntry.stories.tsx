import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Provider } from "react-redux";
import { GameMode, RoleConfigMode, Team } from "@/lib/types";
import { store } from "@/store";
import { RoleListEntry } from "./RoleListEntry";

const meta = {
  component: RoleListEntry,
  decorators: [
    (Story) => (
      <Provider store={store}>
        <ul>
          <Story />
        </ul>
      </Provider>
    ),
  ],
} satisfies Meta<typeof RoleListEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

const role = {
  id: "werewolf-seer",
  name: "Seer",
  summary: "Investigates one player each night to learn their team.",
  team: Team.Good,
};

const DEFAULT_ARGS = {
  role,
  gameMode: GameMode.Werewolf,
  roleConfigMode: RoleConfigMode.Default,
  dimmed: false,
  readOnly: true,
  count: 1,
  disabled: false,
} satisfies Story["args"];

export const ReadOnly: Story = {
  args: DEFAULT_ARGS,
};

export const ReadOnlyDimmed: Story = {
  args: { ...DEFAULT_ARGS, dimmed: true },
};

export const Editable: Story = {
  args: { ...DEFAULT_ARGS, readOnly: false },
};

export const EditableDimmed: Story = {
  args: { ...DEFAULT_ARGS, readOnly: false, dimmed: true },
};

export const EditableDisabled: Story = {
  args: { ...DEFAULT_ARGS, readOnly: false, disabled: true },
};
