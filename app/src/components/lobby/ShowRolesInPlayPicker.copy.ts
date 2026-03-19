import { ShowRolesInPlay } from "@/lib/types";

export const SHOW_ROLES_IN_PLAY_PICKER_COPY = {
  label: "Show roles in play",
} as const;

export const SHOW_ROLES_OPTIONS: {
  value: ShowRolesInPlay;
  title: string;
  description: string;
}[] = [
  {
    value: ShowRolesInPlay.None,
    title: "None",
    description:
      "Players cannot see which roles were configured for this game.",
  },
  {
    value: ShowRolesInPlay.ConfiguredOnly,
    title: "Configured only",
    description:
      "Players see which roles were configured, but not if they were assigned or how many are in play.",
  },
  {
    value: ShowRolesInPlay.AssignedRolesOnly,
    title: "Assigned roles",
    description:
      "Players see which roles were assigned, but not how many are in play.",
  },
  {
    value: ShowRolesInPlay.RoleAndCount,
    title: "Role and count",
    description:
      "Players see how many of each roles were assigned for the game.",
  },
];
