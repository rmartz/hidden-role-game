import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfRole } from "../roles";
import { WerewolfPhase } from "../types";
import type { WerewolfTurnState } from "../types";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "../timer-config";

const action = WEREWOLF_ACTIONS[WerewolfAction.ConfirmEvilEmpathResult];

/**
 * Creates a game where playerOrder places the Seer between a Werewolf and a
 * Villager. seat layout: [werewolf(w1), seer(p2), villager(p3)]
 */
function makeEmpathGame(
  overrides: {
    playerOrder?: string[];
    deadPlayerIds?: string[];
    currentPhaseIndex?: number;
    evilEmpathLastResult?: boolean;
    evilEmpathRevealedResult?: boolean;
  } = {},
): Game {
  const turnState: WerewolfTurnState = {
    turn: 2,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.EvilEmpath],
      currentPhaseIndex: overrides.currentPhaseIndex ?? 1,
      nightActions: {},
    },
    deadPlayerIds: overrides.deadPlayerIds ?? [],
    ...(overrides.evilEmpathLastResult !== undefined
      ? { evilEmpathLastResult: overrides.evilEmpathLastResult }
      : {}),
    ...(overrides.evilEmpathRevealedResult !== undefined
      ? { evilEmpathRevealedResult: overrides.evilEmpathRevealedResult }
      : {}),
  };
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "w1", name: "Wolf", sessionId: "sw1", visiblePlayers: [] },
      { id: "p2", name: "Seer", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Villager", sessionId: "s3", visiblePlayers: [] },
      { id: "p4", name: "EvilEmpath", sessionId: "s4", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.EvilEmpath },
    ],
    configuredRoleBuckets: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: "owner-1",
    // Seating: w1 ← p2(Seer) → p3 — wolf is left neighbor, villager is right
    playerOrder: overrides.playerOrder ?? ["w1", "p2", "p3", "p4"],
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

describe("WerewolfAction.ConfirmEvilEmpathResult — isValid", () => {
  it("returns true when owner calls it during Evil Empath phase", () => {
    const game = makeEmpathGame();
    expect(action.isValid(game, "owner-1", null)).toBe(true);
  });

  it("returns false when the active phase is not Evil Empath", () => {
    const game = makeEmpathGame({ currentPhaseIndex: 0 });
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("returns false for non-owner callers", () => {
    const game = makeEmpathGame();
    expect(action.isValid(game, "p4", null)).toBe(false);
  });
});

describe("WerewolfAction.ConfirmEvilEmpathResult — adjacency (apply)", () => {
  it("sets evilEmpathLastResult=true when Seer is adjacent to a living Werewolf", () => {
    // playerOrder: [w1, p2(Seer), p3, p4] → p2 neighbors are w1 (wolf) and p3 (villager)
    const game = makeEmpathGame();
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.evilEmpathLastResult).toBe(true);
  });

  it("sets evilEmpathLastResult=false when Seer has no adjacent living Werewolf", () => {
    // Reorder so Seer is between two Villagers: [p3, p2(Seer), p4, w1]
    const game = makeEmpathGame({ playerOrder: ["p3", "p2", "p4", "w1"] });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.evilEmpathLastResult).toBe(false);
  });

  it("sets evilEmpathLastResult=false when the adjacent Werewolf is dead", () => {
    // Wolf is next to Seer but already dead.
    const game = makeEmpathGame({ deadPlayerIds: ["w1"] });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.evilEmpathLastResult).toBe(false);
  });

  it("wraps around the seating ring for adjacency", () => {
    // Seer at index 0, Werewolf at last index → they are adjacent (wrap)
    const game = makeEmpathGame({ playerOrder: ["p2", "p3", "p4", "w1"] });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.evilEmpathLastResult).toBe(true);
  });

  it("marks the night action as confirmed and resultRevealed", () => {
    const game = makeEmpathGame();
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const nightPhase = ts.phase;
    if (nightPhase.type !== WerewolfPhase.Nighttime)
      throw new Error("wrong phase");
    const empathAction = nightPhase.nightActions[WerewolfRole.EvilEmpath];
    expect(empathAction).toBeDefined();
    if (!empathAction || "votes" in empathAction)
      throw new Error("unexpected action type");
    expect(empathAction.confirmed).toBe(true);
    expect(empathAction.resultRevealed).toBe(true);
  });

  it("returns false when no playerOrder is set on the game", () => {
    const game = makeEmpathGame({ playerOrder: [] });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.evilEmpathLastResult).toBe(false);
  });
});
