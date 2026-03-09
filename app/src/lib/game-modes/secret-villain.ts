import { Team } from "@/lib/models";
import type { GameModeConfig, RoleSlot } from "@/lib/models";

export enum SecretVillainRole {
  Good = "good",
  Bad = "bad",
  SpecialBad = "special-bad",
}

const MIN_PLAYERS = 5;

function defaultRoleCount(numPlayers: number): RoleSlot[] {
  const n = Math.max(numPlayers, MIN_PLAYERS);
  const specialBad = 1;
  const bad = Math.floor((n - 1) / 2) - 1;
  const good = n - specialBad - bad;
  return [
    { roleId: SecretVillainRole.SpecialBad, count: specialBad },
    { roleId: SecretVillainRole.Bad, count: bad },
    { roleId: SecretVillainRole.Good, count: good },
  ];
}

export const SECRET_VILLAIN_CONFIG = {
  name: "Secret Villain",
  minPlayers: MIN_PLAYERS,
  ownerTitle: null,
  teamLabels: {
    [Team.Good]: "Liberal",
    [Team.Bad]: "Fascist",
  },
  roles: {
    [SecretVillainRole.Good]: {
      id: SecretVillainRole.Good,
      name: "Good Role",
      team: Team.Good,
    },
    [SecretVillainRole.Bad]: {
      id: SecretVillainRole.Bad,
      name: "Bad Role",
      team: Team.Bad,
      canSeeTeam: [Team.Bad],
    },
    [SecretVillainRole.SpecialBad]: {
      id: SecretVillainRole.SpecialBad,
      name: "Special Bad Role",
      team: Team.Bad,
    },
  },
  defaultRoleCount,
} satisfies GameModeConfig;
