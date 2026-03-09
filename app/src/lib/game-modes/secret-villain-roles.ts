import type { RoleDefinition } from "@/lib/models";

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
