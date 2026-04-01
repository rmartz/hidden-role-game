import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RoleGlossaryDialog } from "./RoleGlossaryDialog";
import { GameMode, Team } from "@/lib/types";
import type { RoleDefinition } from "@/lib/types";
import {
  WEREWOLF_ROLE_CATEGORY_ORDER,
  WEREWOLF_ROLE_CATEGORY_LABELS,
  WerewolfRoleCategory,
} from "@/lib/game-modes/werewolf/roles";

const meta = {
  component: RoleGlossaryDialog,
} satisfies Meta<typeof RoleGlossaryDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const werewolfRoles: RoleDefinition<string, Team>[] = [
  {
    id: "werewolf-werewolf",
    name: "Werewolf",
    team: Team.Bad,
    summary: "Eliminates a villager each night",
    description:
      "Each night the Werewolves wake together to choose their victim.",
    category: WerewolfRoleCategory.EvilKilling,
  },
  {
    id: "werewolf-seer",
    name: "Seer",
    team: Team.Good,
    summary: "Discovers if a player is evil each night",
    description:
      "Each night the Seer targets one player and the Narrator reveals whether that player is a Werewolf.",
    category: WerewolfRoleCategory.VillagerInvestigation,
  },
  {
    id: "werewolf-bodyguard",
    name: "Bodyguard",
    team: Team.Good,
    summary: "Protects a player from elimination each night",
    description:
      "Each night the Bodyguard chooses one player to protect. If that player is attacked, they survive.",
    category: WerewolfRoleCategory.VillagerProtection,
  },
  {
    id: "werewolf-villager",
    name: "Villager",
    team: Team.Good,
    summary: "An ordinary member of the village",
    description: "The Villager has no special abilities and no night action.",
    category: WerewolfRoleCategory.VillagerSupport,
  },
  {
    id: "werewolf-tanner",
    name: "Tanner",
    team: Team.Neutral,
    summary: "Wins by getting eliminated",
    description: "The Tanner is a Neutral player who wins by being eliminated.",
    category: WerewolfRoleCategory.NeutralManipulation,
  },
];

export const Default: Story = {
  args: {
    roles: werewolfRoles,
    gameMode: GameMode.Werewolf,
    title: "Role Glossary",
    triggerLabel: "View Roles",
    categoryOrder: WEREWOLF_ROLE_CATEGORY_ORDER,
    categoryLabels: WEREWOLF_ROLE_CATEGORY_LABELS,
  },
};
