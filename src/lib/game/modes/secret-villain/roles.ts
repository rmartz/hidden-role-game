import { Team } from "@/lib/types";
import type { RoleBucket } from "@/lib/types";

export enum SecretVillainRole {
  Good = "good",
  Bad = "bad",
  SpecialBad = "special-bad",
}

export const MIN_PLAYERS = 5;

export function defaultRoleCount(numPlayers: number): RoleBucket[] {
  const n = Math.max(numPlayers, MIN_PLAYERS);
  const specialBad = 1;
  const bad = Math.floor((n - 1) / 2) - 1;
  const good = n - specialBad - bad;
  return [
    {
      playerCount: specialBad,
      roles: [{ roleId: SecretVillainRole.SpecialBad, min: 1 }],
    },
    { playerCount: bad, roles: [{ roleId: SecretVillainRole.Bad, min: 1 }] },
    { playerCount: good, roles: [{ roleId: SecretVillainRole.Good, min: 1 }] },
  ];
}

export const SECRET_VILLAIN_ROLES = {
  [SecretVillainRole.Good]: {
    id: SecretVillainRole.Good,
    name: "Good Role",
    team: Team.Good,
  },
  [SecretVillainRole.Bad]: {
    id: SecretVillainRole.Bad,
    name: "Bad Role",
    team: Team.Bad,
    awareOf: { teams: [Team.Bad], revealRole: true },
  },
  [SecretVillainRole.SpecialBad]: {
    id: SecretVillainRole.SpecialBad,
    name: "Special Bad Role",
    team: Team.Bad,
  },
};
