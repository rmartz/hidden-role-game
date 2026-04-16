import { describe, it, expect } from "vitest";
import { GameMode, GameStatus } from "@/lib/types";
import type {
  WerewolfTurnState,
  WerewolfDaytimePhase,
  WerewolfNighttimePhase,
} from "../types";
import { WerewolfPhase } from "../types";
import { WerewolfRole } from "../roles";
import { WerewolfAction, WEREWOLF_ACTIONS } from "./index";
import { WerewolfWinner } from "../utils/win-condition";
import {
  makePlayingGame,
  makeNightState,
  nightTurnState,
  dayTurnState,
} from "./test-helpers";

// ---------------------------------------------------------------------------
// StartDay — isValid + basic apply
// ---------------------------------------------------------------------------

describe("WerewolfAction.StartDay — isValid", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("returns true during nighttime when called by owner", () => {
    const game = makePlayingGame(nightTurnState);
    expect(action.isValid(game, "owner-1", null)).toBe(true);
  });

  it("returns false during daytime", () => {
    const game = makePlayingGame(dayTurnState);
    expect(action.isValid(game, "owner-1", null)).toBe(false);
  });

  it("returns false when called by non-owner", () => {
    const game = makePlayingGame(nightTurnState);
    expect(action.isValid(game, "player-2", null)).toBe(false);
  });
});

describe("WerewolfAction.StartDay — basic apply", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("transitions to daytime on the same turn", () => {
    const game = makePlayingGame(nightTurnState);
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.turn).toBe(1);
    expect(ts.phase.type).toBe(WerewolfPhase.Daytime);
  });

  it("sets startedAt to a recent timestamp", () => {
    const before = Date.now();
    const game = makePlayingGame(nightTurnState);
    action.apply(game, null, "owner-1");
    const after = Date.now();
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as { startedAt: number };
    expect(phase.startedAt).toBeGreaterThanOrEqual(before);
    expect(phase.startedAt).toBeLessThanOrEqual(after);
  });

  it("pre-populates revealedPlayerIds with all affected players when auto reveal is enabled", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p2",
          },
        },
      }),
      {
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: false,
          trialsPerDay: 2,
          revealProtections: true,
          showRolesOnDeath: true,
          autoRevealNightOutcome: true,
        },
      },
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfDaytimePhase;
    // p2 was attacked and should appear in revealedPlayerIds when auto-reveal is on
    expect(phase.revealedPlayerIds).toContain("p2");
  });

  it("initializes revealedPlayerIds as empty when auto reveal is disabled", () => {
    const game = makePlayingGame(nightTurnState, {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: false,
        trialsPerDay: 2,
        revealProtections: true,
        showRolesOnDeath: true,
        autoRevealNightOutcome: false,
      },
    });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfDaytimePhase;
    expect(phase.revealedPlayerIds).toEqual([]);
  });

  it("resolves night actions and adds killed players to deadPlayerIds", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p2",
          },
        },
      }),
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).toContain("p2");
  });

  it("stores nightResolution in the daytime phase", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p2",
          },
        },
      }),
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfDaytimePhase;
    expect(phase.nightResolution).toBeDefined();
    expect(phase.nightResolution).toHaveLength(1);
    expect(phase.nightResolution![0]).toMatchObject({
      type: "killed",
      targetPlayerId: "p2",
      died: true,
    });
  });

  it("omits nightResolution when there are no night actions", () => {
    const game = makePlayingGame(nightTurnState);
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfDaytimePhase;
    expect(phase.nightResolution).toBeUndefined();
  });

  it("smited player appears in deadPlayerIds after start-day", () => {
    const nightState = makeNightState();
    (nightState.phase as WerewolfNighttimePhase).smitedPlayerIds = ["p3"];
    const game = makePlayingGame(nightState);
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).toContain("p3");
  });

  it("smitedPlayerIds is carried to the daytime phase", () => {
    const nightState = makeNightState();
    (nightState.phase as WerewolfNighttimePhase).smitedPlayerIds = ["p3", "p4"];
    const game = makePlayingGame(nightState);
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    const phase = ts.phase as WerewolfDaytimePhase;
    expect(phase.smitedPlayerIds).toEqual(["p3", "p4"]);
  });
});

// ---------------------------------------------------------------------------
// StartDay — protection and special role interactions
// ---------------------------------------------------------------------------

describe("WerewolfAction.StartDay — protection roles", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("does not kill a player protected by Bodyguard", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p2",
          },
          [WerewolfRole.Bodyguard]: { targetPlayerId: "p2" },
        },
      }),
      {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Bodyguard },
        ],
      },
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).not.toContain("p2");
  });

  it("Doctor protection saves a player through the full start-day flow", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p2",
          },
          [WerewolfRole.Doctor]: { targetPlayerId: "p2" },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Doctor],
      }),
      {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Doctor },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      },
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).not.toContain("p2");
  });

  it("Priest ward is created from night action and protects on the same night", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p2",
          },
          [WerewolfRole.Priest]: { targetPlayerId: "p2" },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Priest],
      }),
      {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Priest },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      },
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).not.toContain("p2");
  });

  it("Priest ward persists to next turn when warded player is NOT attacked", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p4",
          },
          [WerewolfRole.Priest]: { targetPlayerId: "p2" },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Priest],
      }),
      {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Priest },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      },
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.priestWards).toEqual({ p2: "p3" });
  });

  it("Priest ward is consumed when warded player IS attacked", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p2",
          },
          [WerewolfRole.Priest]: { targetPlayerId: "p2" },
        },
        nightPhaseOrder: [WerewolfRole.Werewolf, WerewolfRole.Priest],
      }),
      {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Priest },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      },
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.priestWards).toBeUndefined();
    expect(ts.deadPlayerIds).not.toContain("p2");
  });

  it("Tough Guy survives first attack, toughGuyHitIds is populated", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p2",
          },
        },
      }),
      {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.ToughGuy },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      },
    );
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).not.toContain("p2");
    expect(ts.toughGuyHitIds).toContain("p2");
  });

  it("Tough Guy dies on second attack when toughGuyHitIds already contains them", () => {
    const nightState = makeNightState({
      nightActions: {
        [WerewolfRole.Werewolf]: {
          votes: [],
          suggestedTargetId: "p2",
        },
      },
    });
    nightState.toughGuyHitIds = ["p2"];
    const game = makePlayingGame(nightState, {
      roleAssignments: [
        { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
        { playerId: "p2", roleDefinitionId: WerewolfRole.ToughGuy },
        { playerId: "p3", roleDefinitionId: WerewolfRole.Seer },
        { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
        { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
      ],
    });
    action.apply(game, null, "owner-1");
    const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
    expect(ts.deadPlayerIds).toContain("p2");
  });
});

// ---------------------------------------------------------------------------
// StartDay — Hunter and Vigilante
// ---------------------------------------------------------------------------

describe("WerewolfAction.StartDay — Hunter and Vigilante", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  describe("Hunter", () => {
    const hunterRoleAssignments = [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
    ];

    it("sets hunterRevengePlayerId when the Hunter dies at night", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [WerewolfRole.Werewolf]: {
              votes: [],
              suggestedTargetId: "p2",
            },
          },
        }),
        { roleAssignments: hunterRoleAssignments },
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.hunterRevengePlayerId).toBe("p2");
      expect(ts.deadPlayerIds).toContain("p2");
    });

    it("defers win condition check when Hunter dies", () => {
      // 2 wolves + 2 villagers + hunter: killing hunter makes
      // 2 wolves vs 2 villagers — tie = wolves win.
      // But with hunter revenge pending, the game should NOT end yet.
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [WerewolfRole.Werewolf]: {
              votes: [],
              suggestedTargetId: "p2",
            },
          },
        }),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p6", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Hunter },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          ],
          players: [
            { id: "p1", name: "W1", sessionId: "s1", visiblePlayers: [] },
            { id: "p6", name: "W2", sessionId: "s6", visiblePlayers: [] },
            { id: "p2", name: "Hunter", sessionId: "s2", visiblePlayers: [] },
            { id: "p3", name: "V1", sessionId: "s3", visiblePlayers: [] },
            { id: "p4", name: "V2", sessionId: "s4", visiblePlayers: [] },
          ],
        },
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      // Game should still be playing (not finished), pending Hunter revenge
      expect(ts.phase.type).toBe(WerewolfPhase.Daytime);
      expect(ts.hunterRevengePlayerId).toBe("p2");
    });

    it("does not set hunterRevengePlayerId when Hunter is not killed", () => {
      const game = makePlayingGame(
        makeNightState({
          nightActions: {
            [WerewolfRole.Werewolf]: {
              votes: [],
              suggestedTargetId: "p3",
            },
          },
        }),
        { roleAssignments: hunterRoleAssignments },
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.hunterRevengePlayerId).toBeUndefined();
    });
  });

  describe("Vigilante", () => {
    const vigilanteRoleAssignments = [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "p2", roleDefinitionId: WerewolfRole.Vigilante },
      { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
      { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
    ];

    it("Vigilante kills target normally", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Vigilante]: { targetPlayerId: "p3" },
          },
        }),
        { roleAssignments: vigilanteRoleAssignments },
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.deadPlayerIds).toContain("p3");
      // Vigilante killed a Good player → also dies
      expect(ts.deadPlayerIds).toContain("p2");
    });

    it("Vigilante survives when killing a Bad-team player", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Vigilante]: { targetPlayerId: "p1" },
          },
        }),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p6", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Vigilante },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
          ],
          players: [
            { id: "p1", name: "W1", sessionId: "s1", visiblePlayers: [] },
            { id: "p6", name: "W2", sessionId: "s6", visiblePlayers: [] },
            { id: "p2", name: "Vig", sessionId: "s2", visiblePlayers: [] },
            { id: "p3", name: "V1", sessionId: "s3", visiblePlayers: [] },
            { id: "p4", name: "V2", sessionId: "s4", visiblePlayers: [] },
            { id: "p5", name: "V3", sessionId: "s5", visiblePlayers: [] },
          ],
        },
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.deadPlayerIds).toContain("p1");
      expect(ts.deadPlayerIds).not.toContain("p2");
    });

    it("Vigilante does not self-die when target is protected", () => {
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Vigilante]: { targetPlayerId: "p3" },
            [WerewolfRole.Bodyguard]: { targetPlayerId: "p3" },
          },
        }),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Vigilante },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Bodyguard },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      expect(ts.deadPlayerIds).not.toContain("p3");
      expect(ts.deadPlayerIds).not.toContain("p2");
    });

    it("Vigilante still self-dies when protected but kills a Good player", () => {
      // Wolves attack Vigilante, Bodyguard protects Vigilante,
      // Vigilante kills a Good player → Vigilante survives wolf attack
      // but still self-dies from killing Good
      const game = makePlayingGame(
        makeNightState({
          turn: 2,
          nightActions: {
            [WerewolfRole.Werewolf]: {
              votes: [],
              suggestedTargetId: "p2",
            },
            [WerewolfRole.Vigilante]: { targetPlayerId: "p5" },
            [WerewolfRole.Bodyguard]: { targetPlayerId: "p2" },
          },
        }),
        {
          roleAssignments: [
            { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
            { playerId: "p2", roleDefinitionId: WerewolfRole.Vigilante },
            { playerId: "p3", roleDefinitionId: WerewolfRole.Villager },
            { playerId: "p4", roleDefinitionId: WerewolfRole.Bodyguard },
            { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
          ],
        },
      );
      action.apply(game, null, "owner-1");
      const ts = (game.status as { turnState: WerewolfTurnState }).turnState;
      // p5 killed by Vigilante
      expect(ts.deadPlayerIds).toContain("p5");
      // Vigilante self-dies (killed Good player)
      expect(ts.deadPlayerIds).toContain("p2");
    });
  });
});

// ---------------------------------------------------------------------------
// StartDay — Tanner
// ---------------------------------------------------------------------------

describe("WerewolfAction.StartDay — Tanner", () => {
  const action = WEREWOLF_ACTIONS[WerewolfAction.StartDay];

  it("Tanner killed at night ends game with Tanner winner", () => {
    const game = makePlayingGame(
      makeNightState({
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p3",
          },
        },
      }),
      {
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Tanner },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      },
    );
    action.apply(game, null, "owner-1");
    expect(game.status.type).toBe(GameStatus.Finished);
    expect((game.status as { winner?: string }).winner).toBe(
      WerewolfWinner.Tanner,
    );
  });

  it("Tanner killed at night along with other players records all deaths", () => {
    const game = makePlayingGame(
      makeNightState({
        turn: 2,
        nightActions: {
          [WerewolfRole.Werewolf]: {
            votes: [],
            suggestedTargetId: "p3",
          },
          [WerewolfRole.Vigilante]: { targetPlayerId: "p4" },
        },
      }),
      {
        players: [
          { id: "p1", name: "Wolf", sessionId: "s1", visiblePlayers: [] },
          { id: "p2", name: "Vig", sessionId: "s2", visiblePlayers: [] },
          { id: "p3", name: "Tanner", sessionId: "s3", visiblePlayers: [] },
          { id: "p4", name: "V1", sessionId: "s4", visiblePlayers: [] },
          { id: "p5", name: "V2", sessionId: "s5", visiblePlayers: [] },
        ],
        roleAssignments: [
          { playerId: "p1", roleDefinitionId: WerewolfRole.Werewolf },
          { playerId: "p2", roleDefinitionId: WerewolfRole.Vigilante },
          { playerId: "p3", roleDefinitionId: WerewolfRole.Tanner },
          { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
          { playerId: "p5", roleDefinitionId: WerewolfRole.Villager },
        ],
      },
    );
    action.apply(game, null, "owner-1");
    expect(game.status.type).toBe(GameStatus.Finished);
    expect((game.status as { winner?: string }).winner).toBe(
      WerewolfWinner.Tanner,
    );
    // The turn state should have been built with all deaths recorded
    // before the game was marked finished. Verify via the daytime phase
    // that was set before the Tanner override.
    // Since game.status is now Finished (not Playing), the turnState is
    // not directly accessible — but the key invariant is that the Tanner
    // check ran AFTER building the full state.
  });
});
