import type { GameModeConfig, RoleDefinition, RoleSlot } from "@/lib/models";

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

export const MIN_PLAYERS = 5;

export function defaultRoleCount(numPlayers: number): RoleSlot[] {
  const bad = Math.floor(numPlayers / 3);
  const good = numPlayers - bad;
  return [
    { roleId: WerewolfRole.Bad, count: bad },
    { roleId: WerewolfRole.Good, count: good },
  ];
}

export const WEREWOLF_CONFIG: GameModeConfig = {
  name: "Werewolf",
  minPlayers: MIN_PLAYERS,
  ownerTitle: "Narrator",
  roles: Object.values(WEREWOLF_ROLES),
  defaultRoleCount,
};
