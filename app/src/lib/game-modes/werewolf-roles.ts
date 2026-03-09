import type { RoleDefinition } from "@/lib/models";

export enum WerewolfRole {
  Good = "werewolf-good",
  Bad = "werewolf-bad",
}

export enum WerewolfTeam {
  Good = "Good",
  Bad = "Bad",
}

export const WEREWOLF_ROLES: Record<
  WerewolfRole,
  RoleDefinition<WerewolfRole, WerewolfTeam>
> = {
  [WerewolfRole.Good]: {
    id: WerewolfRole.Good,
    name: "Good Role",
    team: WerewolfTeam.Good,
  },
  [WerewolfRole.Bad]: {
    id: WerewolfRole.Bad,
    name: "Bad Role",
    team: WerewolfTeam.Bad,
  },
};
