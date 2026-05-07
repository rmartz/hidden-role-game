import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfRole, WEREWOLF_ROLES } from "../roles";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { extractPlayerNightState } from "../services/player-night-state";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../timer-config";
import { WerewolfAction, WEREWOLF_ACTIONS } from "../actions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGame(
  overrides: {
    roleAssignments?: { playerId: string; roleDefinitionId: string }[];
    playerOrder?: string[];
    turnState?: WerewolfTurnState;
    deadPlayerIds?: string[];
    evilEmpathLastResult?: boolean;
    evilEmpathRevealedResult?: boolean;
  } = {},
): Game {
  const deadPlayerIds = overrides.deadPlayerIds ?? [];
  const turnState: WerewolfTurnState = overrides.turnState ?? {
    turn: 2,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Seer],
      currentPhaseIndex: 0,
      nightActions: {
        [WerewolfRole.Seer]: {
          targetPlayerId: "wolf1",
          confirmed: true,
          resultRevealed: true,
        },
      },
    },
    deadPlayerIds,
    ...(overrides.evilEmpathLastResult !== undefined
      ? { evilEmpathLastResult: overrides.evilEmpathLastResult }
      : {}),
    ...(overrides.evilEmpathRevealedResult !== undefined
      ? { evilEmpathRevealedResult: overrides.evilEmpathRevealedResult }
      : {}),
  };

  const roleAssignments = overrides.roleAssignments ?? [
    { playerId: "seer1", roleDefinitionId: WerewolfRole.Seer },
    { playerId: "wolf1", roleDefinitionId: WerewolfRole.Werewolf },
    { playerId: "v1", roleDefinitionId: WerewolfRole.Villager },
    { playerId: "v2", roleDefinitionId: WerewolfRole.Villager },
    { playerId: "v3", roleDefinitionId: WerewolfRole.Villager },
    { playerId: "ee1", roleDefinitionId: WerewolfRole.EvilEmpath },
  ];

  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "seer1", name: "Seer", sessionId: "s1", visiblePlayers: [] },
      { id: "wolf1", name: "Wolf", sessionId: "s2", visiblePlayers: [] },
      { id: "v1", name: "Villager1", sessionId: "s3", visiblePlayers: [] },
      { id: "v2", name: "Villager2", sessionId: "s4", visiblePlayers: [] },
      { id: "v3", name: "Villager3", sessionId: "s5", visiblePlayers: [] },
      { id: "ee1", name: "EvilEmpath", sessionId: "s6", visiblePlayers: [] },
    ],
    roleAssignments,
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
    playerOrder: overrides.playerOrder ?? [
      "wolf1",
      "seer1",
      "v1",
      "v2",
      "v3",
      "ee1",
    ],
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: false,
      trialsPerDay: 1,
      revealProtections: true,
      hiddenRoleCount: 0,
      showRolesOnDeath: true,
      autoRevealNightOutcome: true,
    },
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  };
}

// ---------------------------------------------------------------------------
// Illusion Artist: Seer investigation inversion
// ---------------------------------------------------------------------------

describe("Seer investigation — Illusion Artist inversion", () => {
  const seerRole = WEREWOLF_ROLES[WerewolfRole.Seer];

  it("returns isWerewolfTeam=true for Werewolf target when no illusion is active", () => {
    const game = makeGame();
    const result = extractPlayerNightState(game, "seer1", seerRole, []);
    expect(result.investigationResult?.isWerewolfTeam).toBe(true);
  });

  it("inverts the result to false when IllusionArtist confirmed target matches the Seer's target (wolf appears innocent)", () => {
    const game = makeGame({
      turnState: {
        turn: 2,
        phase: {
          type: WerewolfPhase.Nighttime,
          startedAt: 1000,
          nightPhaseOrder: [WerewolfRole.IllusionArtist, WerewolfRole.Seer],
          currentPhaseIndex: 1,
          nightActions: {
            [WerewolfRole.IllusionArtist]: {
              targetPlayerId: "wolf1",
              confirmed: true,
            },
            [WerewolfRole.Seer]: {
              targetPlayerId: "wolf1",
              confirmed: true,
              resultRevealed: true,
            },
          },
        },
        deadPlayerIds: [],
      },
    });
    const result = extractPlayerNightState(game, "seer1", seerRole, []);
    expect(result.investigationResult?.isWerewolfTeam).toBe(false);
  });

  it("inverts the result to true when IllusionArtist confirmed target matches a Villager target (villager appears guilty)", () => {
    const game = makeGame({
      turnState: {
        turn: 2,
        phase: {
          type: WerewolfPhase.Nighttime,
          startedAt: 1000,
          nightPhaseOrder: [WerewolfRole.IllusionArtist, WerewolfRole.Seer],
          currentPhaseIndex: 1,
          nightActions: {
            [WerewolfRole.IllusionArtist]: {
              targetPlayerId: "v1",
              confirmed: true,
            },
            [WerewolfRole.Seer]: {
              targetPlayerId: "v1",
              confirmed: true,
              resultRevealed: true,
            },
          },
        },
        deadPlayerIds: [],
      },
    });
    const result = extractPlayerNightState(game, "seer1", seerRole, []);
    expect(result.investigationResult?.isWerewolfTeam).toBe(true);
  });

  it("does not invert when IllusionArtist targets a different player than the Seer's target", () => {
    // Illusion is on v1, but Seer is investigating wolf1
    const game = makeGame({
      turnState: {
        turn: 2,
        phase: {
          type: WerewolfPhase.Nighttime,
          startedAt: 1000,
          nightPhaseOrder: [WerewolfRole.IllusionArtist, WerewolfRole.Seer],
          currentPhaseIndex: 1,
          nightActions: {
            [WerewolfRole.IllusionArtist]: {
              targetPlayerId: "v1",
              confirmed: true,
            },
            [WerewolfRole.Seer]: {
              targetPlayerId: "wolf1",
              confirmed: true,
              resultRevealed: true,
            },
          },
        },
        deadPlayerIds: [],
      },
    });
    const result = extractPlayerNightState(game, "seer1", seerRole, []);
    expect(result.investigationResult?.isWerewolfTeam).toBe(true);
  });

  it("does not invert when IllusionArtist has not confirmed their target yet", () => {
    // Illusion Artist has set target but not confirmed
    const game = makeGame({
      turnState: {
        turn: 2,
        phase: {
          type: WerewolfPhase.Nighttime,
          startedAt: 1000,
          nightPhaseOrder: [WerewolfRole.IllusionArtist, WerewolfRole.Seer],
          currentPhaseIndex: 1,
          nightActions: {
            [WerewolfRole.IllusionArtist]: {
              targetPlayerId: "wolf1",
              // confirmed omitted — not yet confirmed
            },
            [WerewolfRole.Seer]: {
              targetPlayerId: "wolf1",
              confirmed: true,
              resultRevealed: true,
            },
          },
        },
        deadPlayerIds: [],
      },
    });
    const result = extractPlayerNightState(game, "seer1", seerRole, []);
    expect(result.investigationResult?.isWerewolfTeam).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Evil Empath: state extraction
// ---------------------------------------------------------------------------

describe("Evil Empath — extractPlayerNightState", () => {
  const empathRole = WEREWOLF_ROLES[WerewolfRole.EvilEmpath];

  it("returns no evilEmpathNightResult when no result has been recorded yet", () => {
    const game = makeGame({
      roleAssignments: [
        { playerId: "ee1", roleDefinitionId: WerewolfRole.EvilEmpath },
        { playerId: "wolf1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "seer1", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "v1", roleDefinitionId: WerewolfRole.Villager },
      ],
      turnState: {
        turn: 2,
        phase: {
          type: WerewolfPhase.Nighttime,
          startedAt: 1000,
          nightPhaseOrder: [WerewolfRole.EvilEmpath],
          currentPhaseIndex: 0,
          nightActions: {},
        },
        deadPlayerIds: [],
      },
    });
    const result = extractPlayerNightState(game, "ee1", empathRole, []);
    expect(result.evilEmpathNightResult).toBeUndefined();
  });

  it("surfaces evilEmpathLastResult to the Evil Empath player as evilEmpathNightResult", () => {
    const game = makeGame({
      roleAssignments: [
        { playerId: "ee1", roleDefinitionId: WerewolfRole.EvilEmpath },
        { playerId: "wolf1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "seer1", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "v1", roleDefinitionId: WerewolfRole.Villager },
      ],
      turnState: {
        turn: 2,
        phase: {
          type: WerewolfPhase.Nighttime,
          startedAt: 1000,
          nightPhaseOrder: [WerewolfRole.EvilEmpath],
          currentPhaseIndex: 0,
          nightActions: {
            [WerewolfRole.EvilEmpath]: {
              confirmed: true,
              resultRevealed: true,
            },
          },
        },
        deadPlayerIds: [],
        evilEmpathLastResult: true,
      },
    });
    const result = extractPlayerNightState(game, "ee1", empathRole, []);
    expect(result.evilEmpathNightResult).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Evil Empath: death reveal surfaces to Werewolves
// ---------------------------------------------------------------------------

describe("Evil Empath — death reveal", () => {
  it("sets evilEmpathRevealedResult when Evil Empath is killed via KillPlayer", () => {
    const killAction = WEREWOLF_ACTIONS[WerewolfAction.KillPlayer];
    const ts: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: [],
      evilEmpathLastResult: true,
    };
    const game = makeGame({ turnState: ts });
    killAction.apply(game, { playerId: "ee1" }, "owner-1");
    const updatedTs = (game.status as { turnState: WerewolfTurnState })
      .turnState;
    expect(updatedTs.evilEmpathRevealedResult).toBe(true);
  });

  it("does not set evilEmpathRevealedResult when a non-Evil-Empath player is killed", () => {
    const killAction = WEREWOLF_ACTIONS[WerewolfAction.KillPlayer];
    const ts: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: [],
      evilEmpathLastResult: true,
    };
    const game = makeGame({ turnState: ts });
    // Kill v2 — evil empath (bad) + wolf1 (bad) vs seer1+v1+v3+ee1 → not game over
    killAction.apply(game, { playerId: "v2" }, "owner-1");
    const updatedTs = (
      game.status as { type: string; turnState?: WerewolfTurnState }
    ).turnState;
    expect(updatedTs).toBeDefined();
    expect(updatedTs?.evilEmpathRevealedResult).toBeUndefined();
  });

  it("does not overwrite evilEmpathRevealedResult if already set", () => {
    const killAction = WEREWOLF_ACTIONS[WerewolfAction.KillPlayer];
    const ts: WerewolfTurnState = {
      turn: 2,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: 1000,
        nightActions: {},
      },
      deadPlayerIds: [],
      evilEmpathLastResult: false,
      evilEmpathRevealedResult: true, // already set from a night death
    };
    const game = makeGame({ turnState: ts });
    // Kill v2 — game continues, evilEmpathRevealedResult should stay true
    killAction.apply(game, { playerId: "v2" }, "owner-1");
    const updatedTs = (
      game.status as { type: string; turnState?: WerewolfTurnState }
    ).turnState;
    expect(updatedTs).toBeDefined();
    expect(updatedTs?.evilEmpathRevealedResult).toBe(true);
  });
});
