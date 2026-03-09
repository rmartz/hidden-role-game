import type { GameModeConfig, RoleSlot } from "@/lib/models";

export enum SecretVillainRole {
  Good = "good",
  Bad = "bad",
  SpecialBad = "special-bad",
}

export enum SecretVillainTeam {
  Good = "Good",
  Bad = "Bad",
}

function defaultRoleCount(numPlayers: number): RoleSlot[] {
  const specialBad = 1;
  const bad = Math.floor((numPlayers - 1) / 2) - 1;
  const good = numPlayers - specialBad - bad;
  return [
    { roleId: SecretVillainRole.SpecialBad, count: specialBad },
    { roleId: SecretVillainRole.Bad, count: bad },
    { roleId: SecretVillainRole.Good, count: good },
  ];
}

export const SECRET_VILLAIN_CONFIG = {
  name: "Secret Villain",
  minPlayers: 5,
  ownerTitle: null,
  roles: {
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
  },
  defaultRoleCount,
} satisfies GameModeConfig;
