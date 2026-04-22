import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfRole } from "../roles";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../timer-config";

const action = WEREWOLF_ACTIONS[WerewolfAction.SetIllusionTarget];

function makeIllusionGame(
  overrides: {
    deadPlayerIds?: string[];
    currentPhaseIndex?: number;
    lastTargets?: Record<string, string>;
    nightActions?: Record<string, { targetPlayerId: string }>;
  } = {},
): Game {
  const turnState: WerewolfTurnState = {
    turn: 2,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.IllusionArtist, WerewolfRole.Seer],
      currentPhaseIndex: overrides.currentPhaseIndex ?? 0,
      nightActions: (overrides.nightActions ??
        {}) as WerewolfTurnState["phase"]["nightActions"],
    },
    deadPlayerIds: overrides.deadPlayerIds ?? [],
    ...(overrides.lastTargets ? { lastTargets: overrides.lastTargets } : {}),
  };
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      {
        id: "ia1",
        name: "IllusionArtist",
        sessionId: "sia1",
        visiblePlayers: [],
      },
      { id: "p2", name: "Seer", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "ia1", roleDefinitionId: WerewolfRole.IllusionArtist },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
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
  } as Game;
}

describe("WerewolfAction.SetIllusionTarget — isValid", () => {
  it("returns true when Illusion Artist targets a valid living player", () => {
    const game = makeIllusionGame();
    expect(action.isValid(game, "ia1", { targetPlayerId: "p3" })).toBe(true);
  });

  it("returns false when targeting a dead player", () => {
    const game = makeIllusionGame({ deadPlayerIds: ["p3"] });
    expect(action.isValid(game, "ia1", { targetPlayerId: "p3" })).toBe(false);
  });

  it("returns false when targeting self", () => {
    const game = makeIllusionGame();
    expect(action.isValid(game, "ia1", { targetPlayerId: "ia1" })).toBe(false);
  });

  it("returns false when caller is not the Illusion Artist", () => {
    const game = makeIllusionGame();
    expect(action.isValid(game, "p2", { targetPlayerId: "p3" })).toBe(false);
  });

  it("returns false when the same player was targeted last night (preventRepeatTarget)", () => {
    const game = makeIllusionGame({
      lastTargets: { [WerewolfRole.IllusionArtist]: "p3" },
    });
    expect(action.isValid(game, "ia1", { targetPlayerId: "p3" })).toBe(false);
  });

  it("returns true when targeting a different player than last night", () => {
    const game = makeIllusionGame({
      lastTargets: { [WerewolfRole.IllusionArtist]: "p3" },
    });
    expect(action.isValid(game, "ia1", { targetPlayerId: "p2" })).toBe(true);
  });

  it("returns false when active phase is not Illusion Artist", () => {
    const game = makeIllusionGame({ currentPhaseIndex: 1 });
    expect(action.isValid(game, "ia1", { targetPlayerId: "p3" })).toBe(false);
  });
});

describe("WerewolfAction.SetIllusionTarget — apply", () => {
  it("stores targetPlayerId in nightActions", () => {
    const game = makeIllusionGame();
    action.apply(game, { targetPlayerId: "p3" }, "ia1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const nightPhase = ts.phase;
    if (nightPhase.type !== WerewolfPhase.Nighttime)
      throw new Error("wrong phase");
    const iaAction = nightPhase.nightActions[WerewolfRole.IllusionArtist];
    expect(iaAction).toBeDefined();
    if (!iaAction || "votes" in iaAction)
      throw new Error("unexpected action type");
    expect(iaAction.targetPlayerId).toBe("p3");
  });
});
