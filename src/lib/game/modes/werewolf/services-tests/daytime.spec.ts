import { describe, expect, it } from "vitest";

import type { WerewolfTurnState } from "@/lib/game/modes/werewolf";
import {
  DEFAULT_WEREWOLF_TIMER_CONFIG,
  WerewolfPhase,
  WerewolfRole,
} from "@/lib/game/modes/werewolf";
import type { Game } from "@/lib/types";
import { GameMode, GameStatus, ShowRolesInPlay } from "@/lib/types";

import { extractVisibleDeadPlayerIds } from "../services/owner-state";
import { extractDaytimeState, makeDaytimeGame } from "./helpers";

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
      modeConfig: { revealProtections: false },
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
      modeConfig: { autoRevealNightOutcome: false },
      revealedPlayerIds: [],
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
      modeConfig: { autoRevealNightOutcome: false },
      revealedPlayerIds: [],
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

    expect(extractVisibleDeadPlayerIds(game, "p1")).toEqual([]);
    expect(extractVisibleDeadPlayerIds(game, "p2")).toEqual(["p2"]);
  });

  it("shows the narrator full night outcomes even before reveal", () => {
    const game = makeDaytimeGame({
      modeConfig: { autoRevealNightOutcome: false },
      revealedPlayerIds: [],
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

    const narratorResult = extractDaytimeState(game, "owner");
    expect(narratorResult.nightStatus).toEqual([
      { targetPlayerId: "p2", effect: "killed" },
      { targetPlayerId: "p3", effect: "silenced" },
    ]);
  });

  it("nightStatus contains exposed entry when exposerReveal is set", () => {
    const game = makeDaytimeGame({
      exposerReveal: { playerId: "p2", roleId: WerewolfRole.Seer },
    });

    const result = extractDaytimeState(game, "p1");
    expect(result.nightStatus).toEqual([
      { targetPlayerId: "p2", effect: "exposed", roleName: "Seer" },
    ]);
  });

  it("nightStatus exposed entry is visible to all players", () => {
    const game = makeDaytimeGame({
      exposerReveal: { playerId: "p2", roleId: WerewolfRole.Seer },
    });

    const playerResult = extractDaytimeState(game, "p3");
    const narratorResult = extractDaytimeState(game, "owner");
    expect(playerResult.nightStatus).toEqual([
      { targetPlayerId: "p2", effect: "exposed", roleName: "Seer" },
    ]);
    expect(narratorResult.nightStatus).toEqual([
      { targetPlayerId: "p2", effect: "exposed", roleName: "Seer" },
    ]);
  });

  it("nightStatus contains both kill and exposed entries when both occur", () => {
    const game = makeDaytimeGame({
      nightResolution: [
        {
          type: "killed" as const,
          targetPlayerId: "p3",
          attackedBy: ["p1"],
          protectedBy: [],
          died: true,
        },
      ],
      exposerReveal: { playerId: "p2", roleId: WerewolfRole.Seer },
    });

    const result = extractDaytimeState(game, "p1");
    expect(result.nightStatus).toEqual([
      { targetPlayerId: "p3", effect: "killed" },
      { targetPlayerId: "p2", effect: "exposed", roleName: "Seer" },
    ]);
  });

  it("nightStatus omits exposed entry on subsequent days after the exposure", () => {
    // A prior exposure persists on roleState (so the narrator's night screen
    // can show it across nights), but the per-phase exposerReveal is only set
    // on the day after the exposure. Subsequent daytime phases must not
    // re-emit the "exposed" entry in the Last Night summary.
    const game = makeDaytimeGame({
      // phase.exposerReveal is intentionally absent for this day.
    });
    const status = game.status as { turnState: WerewolfTurnState };
    status.turnState.roleState = {
      exposer: { reveal: { playerId: "p2", roleId: WerewolfRole.Seer } },
    };

    const result = extractDaytimeState(game, "p1");
    expect(result.nightStatus).toBeUndefined();
  });

  it("includes monarch knighting in daytime night summary", () => {
    const game = makeDaytimeGame({
      knightedPlayerId: "p3",
      nightResolution: [],
    });
    const result = extractDaytimeState(game, "p1");
    expect(result.nightStatus).toEqual([
      { targetPlayerId: "p3", effect: "knighted" },
    ]);
  });
});
