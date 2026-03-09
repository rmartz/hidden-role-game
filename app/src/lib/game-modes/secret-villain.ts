import type { GameModeConfig, RoleDefinition, RoleSlot } from "@/lib/models";

export enum SecretVillainRole {
  Good = "good",
  Bad = "bad",
  SpecialBad = "special-bad",
}

export enum SecretVillainTeam {
  Good = "Good",
  Bad = "Bad",
}

export const SECRET_VILLAIN_ROLES: Record<
  SecretVillainRole,
  RoleDefinition<SecretVillainRole, SecretVillainTeam>
> = {
  [SecretVillainRole.Good]: {
    id: SecretVillainRole.Good,
    name: "Good Role",
    team: SecretVillainTeam.Good,
  },
  [SecretVillainRole.Bad]: {
    id: SecretVillainRole.Bad,
    name: "Bad Role",
    team: SecretVillainTeam.Bad,
    canSeeTeam: [SecretVillainTeam.Bad],
  },
  [SecretVillainRole.SpecialBad]: {
    id: SecretVillainRole.SpecialBad,
    name: "Special Bad Role",
    team: SecretVillainTeam.Bad,
  },
};

export const MIN_PLAYERS = 5;

export function defaultRoleCount(numPlayers: number): RoleSlot[] {
  const specialBad = 1;
  const bad = Math.floor((numPlayers - 1) / 2) - 1;
  const good = numPlayers - specialBad - bad;
  return [
    { roleId: SecretVillainRole.SpecialBad, count: specialBad },
    { roleId: SecretVillainRole.Bad, count: bad },
    { roleId: SecretVillainRole.Good, count: good },
  ];
}

export const SECRET_VILLAIN_CONFIG: GameModeConfig = {
  name: "Secret Villain",
  minPlayers: MIN_PLAYERS,
  ownerTitle: null,
  roles: Object.values(SECRET_VILLAIN_ROLES),
  defaultRoleCount,
};
