import { sum } from "lodash";
import { GameStatus, Team } from "@/lib/models";
import type {
  Game,
  GameAction,
  GameModeConfig,
  PlayerRoleAssignment,
  RoleDefinition,
  RoleSlot,
} from "@/lib/models";

export enum WerewolfPhase {
  Nighttime = "nighttime",
  Daytime = "daytime",
}

export interface WerewolfNighttimePhase {
  type: WerewolfPhase.Nighttime;
  /** Role IDs in the order they wake, determined at phase start. */
  nightPhaseOrder: string[];
  /** Index into nightPhaseOrder for the currently active role. */
  currentPhaseIndex: number;
}

export interface WerewolfDaytimePhase {
  type: WerewolfPhase.Daytime;
  /** Unix epoch ms when the day phase began (for elapsed-time display). */
  startedAt: number;
}

export type WerewolfTurnPhase = WerewolfNighttimePhase | WerewolfDaytimePhase;

export interface WerewolfTurnState {
  turn: number;
  phase: WerewolfTurnPhase;
}

export enum WakesAtNight {
  Never = "Never",
  FirstNightOnly = "FirstNightOnly",
  EveryNight = "EveryNight",
}

export interface WerewolfRoleDefinition extends RoleDefinition<
  WerewolfRole,
  Team
> {
  wakesAtNight: WakesAtNight;
}

export enum WerewolfRole {
  Villager = "werewolf-villager",
  Werewolf = "werewolf-werewolf",
  Seer = "werewolf-seer",
  Witch = "werewolf-witch",
  Spellcaster = "werewolf-spellcaster",
  Mason = "werewolf-mason",
  Chupacabra = "werewolf-chupacabra",
  VillageIdiot = "werewolf-village-idiot",
  Bodyguard = "werewolf-bodyguard",
}

const MIN_PLAYERS = 5;

function defaultRoleCount(numPlayers: number): RoleSlot[] {
  const n = Math.max(numPlayers, MIN_PLAYERS);
  const werewolves = Math.floor(n / 3);
  const villagers = n - werewolves - 1;
  return [
    { roleId: WerewolfRole.Werewolf, count: werewolves },
    { roleId: WerewolfRole.Villager, count: villagers },
    { roleId: WerewolfRole.Seer, count: 1 },
  ];
}

export const WEREWOLF_ROLES: Record<WerewolfRole, WerewolfRoleDefinition> = {
  [WerewolfRole.Villager]: {
    id: WerewolfRole.Villager,
    name: "Villager",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
  },
  [WerewolfRole.Werewolf]: {
    id: WerewolfRole.Werewolf,
    name: "Werewolf",
    team: Team.Bad,
    canSeeTeam: [Team.Bad],
    wakesAtNight: WakesAtNight.EveryNight,
  },
  [WerewolfRole.Seer]: {
    id: WerewolfRole.Seer,
    name: "Seer",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
  },
  [WerewolfRole.Witch]: {
    id: WerewolfRole.Witch,
    name: "Witch",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
  },
  [WerewolfRole.Spellcaster]: {
    id: WerewolfRole.Spellcaster,
    name: "Spellcaster",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
  },
  [WerewolfRole.Mason]: {
    id: WerewolfRole.Mason,
    name: "Mason",
    team: Team.Good,
    canSeeRole: [WerewolfRole.Mason],
    wakesAtNight: WakesAtNight.FirstNightOnly,
  },
  [WerewolfRole.Chupacabra]: {
    id: WerewolfRole.Chupacabra,
    name: "Chupacabra",
    team: Team.Neutral,
    wakesAtNight: WakesAtNight.EveryNight,
  },
  [WerewolfRole.VillageIdiot]: {
    id: WerewolfRole.VillageIdiot,
    name: "Village Idiot",
    team: Team.Good,
    wakesAtNight: WakesAtNight.Never,
  },
  [WerewolfRole.Bodyguard]: {
    id: WerewolfRole.Bodyguard,
    name: "Bodyguard",
    team: Team.Good,
    wakesAtNight: WakesAtNight.EveryNight,
  },
};

/**
 * Returns the ordered list of role IDs that wake during a Werewolf night phase.
 * On turn 1, includes first-night-only roles; subsequent turns exclude them.
 * Only includes roles that are actually assigned in the current game.
 */
export function buildNightPhaseOrder(
  turn: number,
  roleAssignments: PlayerRoleAssignment[],
): string[] {
  const assignedRoleIds = new Set(
    roleAssignments.map((a) => a.roleDefinitionId),
  );
  return Object.values(WEREWOLF_ROLES)
    .filter((role) => {
      if (!assignedRoleIds.has(role.id)) return false;
      if (role.wakesAtNight === WakesAtNight.EveryNight) return true;
      if (role.wakesAtNight === WakesAtNight.FirstNightOnly) return turn === 1;
      return false;
    })
    .map((role) => role.id);
}

export enum WerewolfAction {
  StartNight = "start-night",
  StartDay = "start-day",
  SetNightPhase = "set-night-phase",
}

function isOwnerPlaying(game: Game, callerId: string): boolean {
  return (
    callerId === game.ownerPlayerId && game.status.type === GameStatus.Playing
  );
}

function currentTurnState(game: Game): WerewolfTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as WerewolfTurnState | undefined;
}

const WEREWOLF_ACTIONS: Record<WerewolfAction, GameAction> = {
  [WerewolfAction.StartNight]: {
    isValid(game, callerId) {
      if (!isOwnerPlaying(game, callerId)) return false;
      return currentTurnState(game)?.phase.type === WerewolfPhase.Daytime;
    },
    apply(game) {
      const ts = currentTurnState(game);
      if (!ts) return;
      const nextTurn = ts.turn + 1;
      const nightPhaseOrder = buildNightPhaseOrder(
        nextTurn,
        game.roleAssignments,
      );
      game.status = {
        type: GameStatus.Playing,
        turnState: {
          turn: nextTurn,
          phase: {
            type: WerewolfPhase.Nighttime,
            nightPhaseOrder,
            currentPhaseIndex: 0,
          },
        },
      };
    },
  },
  [WerewolfAction.StartDay]: {
    isValid(game, callerId) {
      if (!isOwnerPlaying(game, callerId)) return false;
      return currentTurnState(game)?.phase.type === WerewolfPhase.Nighttime;
    },
    apply(game) {
      const ts = currentTurnState(game);
      if (!ts) return;
      game.status = {
        type: GameStatus.Playing,
        turnState: {
          turn: ts.turn,
          phase: { type: WerewolfPhase.Daytime, startedAt: Date.now() },
        },
      };
    },
  },
  [WerewolfAction.SetNightPhase]: {
    isValid(game, callerId, payload) {
      if (!isOwnerPlaying(game, callerId)) return false;
      const ts = currentTurnState(game);
      if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;
      const { phaseIndex } = payload as { phaseIndex?: unknown };
      return (
        typeof phaseIndex === "number" &&
        phaseIndex >= 0 &&
        phaseIndex < ts.phase.nightPhaseOrder.length
      );
    },
    apply(game, payload) {
      const ts = currentTurnState(game);
      if (!ts) return;
      const { phaseIndex } = payload as { phaseIndex: number };
      const phase = ts.phase as WerewolfNighttimePhase;
      game.status = {
        type: GameStatus.Playing,
        turnState: {
          ...ts,
          phase: { ...phase, currentPhaseIndex: phaseIndex },
        },
      };
    },
  },
};

export const WEREWOLF_CONFIG = {
  name: "Werewolf",
  minPlayers: MIN_PLAYERS,
  ownerTitle: "Narrator",
  teamLabels: {
    [Team.Good]: "Villagers",
    [Team.Bad]: "Werewolves",
    [Team.Neutral]: "Neutral",
  },
  roles: WEREWOLF_ROLES,
  defaultRoleCount,
  actions: WEREWOLF_ACTIONS,
  // The Narrator is a player but doesn't receive a role.
  isValidRoleCount(numPlayers: number, roleCounts: Record<string, number>) {
    return sum(Object.values(roleCounts)) === numPlayers - 1;
  },
} satisfies GameModeConfig;
