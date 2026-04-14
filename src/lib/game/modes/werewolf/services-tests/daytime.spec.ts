import { describe, it, expect } from "vitest";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";
import type { Game } from "@/lib/types";
import {
  WerewolfPhase,
  WerewolfRole,
  DEFAULT_WEREWOLF_TIMER_CONFIG,
} from "@/lib/game/modes/werewolf";
import type {
  WerewolfTurnState,
  WerewolfModeConfig,
} from "@/lib/game/modes/werewolf";
import { extractDaytimeState, makeDaytimeGame } from "./helpers";
import { extractVisibleDeadPlayerIds } from "../services/owner-state";

describe("extractDaytimeNightSummary", () => {
  it("returns empty when game is not in a daytime phase", () => {
    const game: Game = {
      id: "game-1",
      lobbyId: "lobby-1",
      gameMode: GameMode.Werewolf,
      status: {
        type: GameStatus.Playing,
        turnState: {
          turn: 2,
          phase: {
            type: WerewolfPhase.Nighttime,
            startedAt: 1000,
            nightPhaseOrder: [WerewolfRole.Seer],
            currentPhaseIndex: 0,
            nightActions: {},
          },
          deadPlayerIds: [],
        } satisfies WerewolfTurnState,
      },
      players: [{ id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] }],
      roleAssignments: [
        { playerId: "p2", roleDefinitionId: WerewolfRole.Seer },
      ],
      configuredRoleBuckets: [],
      showRolesInPlay: ShowRolesInPlay.None,
      ownerPlayerId: undefined,
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

    const result = extractDaytimeState(game, "player-1");
    expect(result).toEqual({});
  });

  it("nightStatus contains protected entry when revealProtections is true", () => {
    const game = makeDaytimeGame({
      nightResolution: [
        {
          type: "killed" as const,
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: ["p3"],
          died: false,
        },
      ],
    });

    const result = extractDaytimeState(game, "player-1");
    expect(result.nightStatus).toEqual([
      { targetPlayerId: "p2", effect: "protected" },
    ]);
  });

  it("nightStatus contains killed and protected entries", () => {
    const game = makeDaytimeGame({
      nightResolution: [
        {
          type: "killed" as const,
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: [],
          died: true,
        },
        {
          type: "killed" as const,
          targetPlayerId: "p3",
          attackedBy: ["p1"],
          protectedBy: ["p3"],
          died: false,
        },
      ],
    });

    const result = extractDaytimeState(game, "player-1");
    expect(result.nightStatus).toEqual([
      { targetPlayerId: "p2", effect: "killed" },
      { targetPlayerId: "p3", effect: "protected" },
    ]);
  });

  it("nightStatus omits protected entry when revealProtections is false", () => {
    const game = makeDaytimeGame({
      nightResolution: [
        {
          type: "killed" as const,
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: ["p3"],
          died: false,
        },
      ],
    });
    game.modeConfig = {
      ...(game.modeConfig as WerewolfModeConfig),
      revealProtections: false,
      hiddenRoleCount: 0,
      showRolesOnDeath: true,
    };

    const result = extractDaytimeState(game, "player-1");
    expect(result.nightStatus).toBeUndefined();
  });

  it("nightStatus contains silenced entry for each silenced player", () => {
    const game = makeDaytimeGame({
      nightResolution: [{ type: "silenced", targetPlayerId: "p3" }],
    });

    const result = extractDaytimeState(game, "player-1");
    expect(result.nightStatus).toEqual([
      { targetPlayerId: "p3", effect: "silenced" },
    ]);
  });

  it("nightStatus omits attackedBy and protectedBy", () => {
    const game = makeDaytimeGame({
      nightResolution: [
        {
          type: "killed" as const,
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: [],
          died: true,
        },
      ],
    });

    const result = extractDaytimeState(game, "player-1");
    const entry = result.nightStatus?.[0];
    expect(entry).not.toHaveProperty("attackedBy");
    expect(entry).not.toHaveProperty("protectedBy");
  });

  it("hides killed and silenced outcomes from other players before reveal", () => {
    const game = makeDaytimeGame({
      nightResolution: [
        {
          type: "killed" as const,
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: [],
          died: true,
        },
        { type: "silenced" as const, targetPlayerId: "p3" },
      ],
      deadPlayerIds: ["p2"],
    });
    game.modeConfig = {
      ...(game.modeConfig as WerewolfModeConfig),
      autoRevealNightOutcome: false,
    };
    const turnState =
      game.status.type === GameStatus.Playing
        ? (game.status.turnState as WerewolfTurnState)
        : undefined;
    if (turnState?.phase.type === WerewolfPhase.Daytime) {
      turnState.phase.nightOutcomeRevealStep = "hidden";
    }

    const observerResult = extractDaytimeState(game, "p1");
    const killedResult = extractDaytimeState(game, "p2");
    const silencedResult = extractDaytimeState(game, "p3");

    expect(observerResult.nightStatus).toBeUndefined();
    expect(killedResult.nightStatus).toEqual([
      { targetPlayerId: "p2", effect: "killed" },
    ]);
    expect(silencedResult.nightStatus).toEqual([
      { targetPlayerId: "p3", effect: "silenced" },
    ]);
  });

  it("hides newly killed players from the public dead list before reveal", () => {
    const game = makeDaytimeGame({
      nightResolution: [
        {
          type: "killed" as const,
          targetPlayerId: "p2",
          attackedBy: ["p1"],
          protectedBy: [],
          died: true,
        },
      ],
      deadPlayerIds: ["p2"],
    });
    game.modeConfig = {
      ...(game.modeConfig as WerewolfModeConfig),
      autoRevealNightOutcome: false,
    };
    const turnState =
      game.status.type === GameStatus.Playing
        ? (game.status.turnState as WerewolfTurnState)
        : undefined;
    if (turnState?.phase.type === WerewolfPhase.Daytime) {
      turnState.phase.nightOutcomeRevealStep = "hidden";
    }

    expect(extractVisibleDeadPlayerIds(game, "p1")).toEqual([]);
    expect(extractVisibleDeadPlayerIds(game, "p2")).toEqual(["p2"]);
  });
});
