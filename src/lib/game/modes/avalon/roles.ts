import { Team } from "@/lib/types";
import type { RoleDefinition, RoleSlot } from "@/lib/types";

export enum AvalonRole {
  Assassin = "avalon-assassin",
  LoyalServant = "avalon-loyal-servant",
  Merlin = "avalon-merlin",
  MinionOfMordred = "avalon-minion",
  Mordred = "avalon-mordred",
  Morgana = "avalon-morgana",
  Oberon = "avalon-oberon",
  Percival = "avalon-percival",
}

export const MIN_PLAYERS = 5;

export function defaultRoleCount(numPlayers: number): RoleSlot[] {
  const n = Math.max(numPlayers, MIN_PLAYERS);
  const bad = Math.floor((n - 1) / 2);
  const good = n - bad;
  return [
    { roleId: AvalonRole.Merlin, min: 1, max: 1 },
    { roleId: AvalonRole.LoyalServant, min: good - 1, max: good - 1 },
    { roleId: AvalonRole.MinionOfMordred, min: bad, max: bad },
  ];
}

export const AVALON_ROLES: Record<
  AvalonRole,
  RoleDefinition<AvalonRole, Team>
> = {
  [AvalonRole.Assassin]: {
    id: AvalonRole.Assassin,
    name: "Assassin",
    team: Team.Bad,
    summary:
      "Knows who is Evil. After 3 Good wins, may identify and eliminate Merlin to steal victory.",
    awareOf: {
      teams: [Team.Bad],
      excludeRoles: [AvalonRole.Oberon],
    },
  },

  [AvalonRole.LoyalServant]: {
    id: AvalonRole.LoyalServant,
    name: "Loyal Servant of Arthur",
    team: Team.Good,
    summary: "A good player with no special knowledge.",
  },

  [AvalonRole.Merlin]: {
    id: AvalonRole.Merlin,
    name: "Merlin",
    team: Team.Good,
    summary: "Knows who is Evil, but must conceal this knowledge.",
    // Sees all Evil players except Mordred (who is excluded via excludeRoles).
    awareOf: {
      teams: [Team.Bad],
      excludeRoles: [AvalonRole.Mordred],
    },
  },

  [AvalonRole.MinionOfMordred]: {
    id: AvalonRole.MinionOfMordred,
    name: "Minion of Mordred",
    team: Team.Bad,
    summary: "Knows who is Evil. Works to sabotage quests.",
    // Sees other Evil players except Oberon (who hides himself from the team).
    awareOf: {
      teams: [Team.Bad],
      excludeRoles: [AvalonRole.Oberon],
    },
  },

  [AvalonRole.Mordred]: {
    id: AvalonRole.Mordred,
    name: "Mordred",
    team: Team.Bad,
    summary: "Knows who is Evil. Hidden from Merlin.",
    awareOf: {
      teams: [Team.Bad],
      excludeRoles: [AvalonRole.Oberon],
    },
  },

  [AvalonRole.Morgana]: {
    id: AvalonRole.Morgana,
    name: "Morgana",
    team: Team.Bad,
    summary: "Knows who is Evil. Appears as Merlin to Percival.",
    awareOf: {
      teams: [Team.Bad],
      excludeRoles: [AvalonRole.Oberon],
    },
  },

  [AvalonRole.Oberon]: {
    id: AvalonRole.Oberon,
    name: "Oberon",
    team: Team.Bad,
    summary:
      "Does not know who is Evil, and the Evil team does not know Oberon.",
    // No awareOf — Oberon has no knowledge of the Evil team.
  },

  [AvalonRole.Percival]: {
    id: AvalonRole.Percival,
    name: "Percival",
    team: Team.Good,
    summary: "Sees Merlin and Morgana but cannot tell them apart.",
    // revealRole: false — Percival knows these players are significant but
    // cannot identify which is Merlin and which is Morgana.
    awareOf: {
      roles: [AvalonRole.Merlin, AvalonRole.Morgana],
      revealRole: false,
    },
  },
};
