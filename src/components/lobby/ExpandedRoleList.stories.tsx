import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameMode, RoleConfigMode, Team } from "@/lib/types";
import type { RoleDefinition } from "@/lib/types";
import { ExpandedRoleList } from "./ExpandedRoleList";

const meta = {
  component: ExpandedRoleList,
} satisfies Meta<typeof ExpandedRoleList>;

export default meta;
type Story = StoryObj<typeof meta>;

function makeRole(
  id: string,
  name: string,
  team: Team,
  category?: string,
): RoleDefinition<string, Team> {
  return { id, name, team, category };
}

const seer = makeRole(
  "werewolf-seer",
  "Seer",
  Team.Good,
  "villager-investigation",
);
const werewolf = makeRole(
  "werewolf-werewolf",
  "Werewolf",
  Team.Bad,
  "evil-killing",
);
const witch = makeRole(
  "werewolf-witch",
  "Witch",
  Team.Good,
  "villager-protection",
);
const villager = makeRole("werewolf-villager", "Villager", Team.Good);

const CATEGORY_LABELS = {
  "villager-investigation": "Villager — Investigation",
  "villager-protection": "Villager — Protection",
  "evil-killing": "Evil — Killing",
};

const SHARED = {
  gameMode: GameMode.Werewolf,
  roleConfigMode: RoleConfigMode.Default,
  readOnly: true,
  counts: {
    "werewolf-seer": 0,
    "werewolf-werewolf": 0,
    "werewolf-witch": 0,
    "werewolf-villager": 0,
  },
  formDisabled: false,
  isSearching: false,
  searchResults: [],
};

export const FlatNoSearch: Story = {
  args: {
    ...SHARED,
    hasCategoryGrouping: false,
    disabledRoles: [seer, werewolf, villager],
    disabledByCategory: [],
    uncategorizedDisabled: [seer, werewolf, villager],
  },
};

export const CategorizedNoSearch: Story = {
  args: {
    ...SHARED,
    hasCategoryGrouping: true,
    disabledRoles: [seer, werewolf, witch],
    disabledByCategory: [
      {
        category: "villager-investigation",
        label: CATEGORY_LABELS["villager-investigation"],
        roles: [seer],
      },
      {
        category: "villager-protection",
        label: CATEGORY_LABELS["villager-protection"],
        roles: [witch],
      },
      {
        category: "evil-killing",
        label: CATEGORY_LABELS["evil-killing"],
        roles: [werewolf],
      },
    ],
    uncategorizedDisabled: [],
  },
};

export const CategorizedWithUncategorized: Story = {
  args: {
    ...SHARED,
    hasCategoryGrouping: true,
    disabledRoles: [seer, werewolf, villager],
    disabledByCategory: [
      {
        category: "villager-investigation",
        label: CATEGORY_LABELS["villager-investigation"],
        roles: [seer],
      },
      {
        category: "evil-killing",
        label: CATEGORY_LABELS["evil-killing"],
        roles: [werewolf],
      },
    ],
    uncategorizedDisabled: [villager],
  },
};

export const ActiveSearch: Story = {
  args: {
    ...SHARED,
    isSearching: true,
    hasCategoryGrouping: true,
    disabledRoles: [seer, werewolf, witch, villager],
    disabledByCategory: [
      {
        category: "villager-investigation",
        label: CATEGORY_LABELS["villager-investigation"],
        roles: [seer],
      },
      {
        category: "villager-protection",
        label: CATEGORY_LABELS["villager-protection"],
        roles: [witch],
      },
      {
        category: "evil-killing",
        label: CATEGORY_LABELS["evil-killing"],
        roles: [werewolf],
      },
    ],
    uncategorizedDisabled: [villager],
    searchResults: [seer],
  },
};

export const NoResults: Story = {
  args: {
    ...SHARED,
    isSearching: true,
    hasCategoryGrouping: true,
    disabledRoles: [seer, werewolf],
    disabledByCategory: [],
    uncategorizedDisabled: [],
    searchResults: [],
  },
};
