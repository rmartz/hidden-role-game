import { describe, it, expect } from "vitest";
import {
  addLobby,
  getLobby,
  updateConfig,
  toggleReady,
  removePlayer,
  addPlayer,
} from "./lobby";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import type { Lobby } from "@/lib/types";
import type { WerewolfModeConfig } from "@/lib/game/modes/werewolf/lobby-config";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";

function makeBaseLobby(overrides: Partial<Lobby["config"]> = {}): Lobby {
  return {
    id: "lobby-1",
    ownerSessionId: "session-owner",
    players: [{ id: "owner", name: "Owner", sessionId: "session-owner" }],
    playerOrder: ["owner"],
    readyPlayerIds: [],
    config: {
      gameMode: GameMode.Werewolf,
      roleConfigMode: RoleConfigMode.Custom,
      roleBuckets: [],
      showConfigToPlayers: false,
      showRolesInPlay: ShowRolesInPlay.None,
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
      ...overrides,
    } as Lobby["config"],
  };
}

describe("updateConfig — nominationsEnabled", () => {
  it("sets nominationsEnabled when true is provided", async () => {
    await addLobby(makeBaseLobby());

    const updated = await updateConfig("lobby-1", {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        hiddenRoleCount: 0,
        showRolesOnDeath: true,
        autoRevealNightOutcome: true,
      },
    });

    expect(
      (updated!.config.modeConfig as WerewolfModeConfig).nominationsEnabled,
    ).toBe(true);
  });

  it("sets nominationsEnabled to false when false is provided", async () => {
    await addLobby(
      makeBaseLobby({
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          trialsPerDay: 1,
          revealProtections: true,
          hiddenRoleCount: 0,
          showRolesOnDeath: true,
          autoRevealNightOutcome: true,
        },
      }),
    );

    const updated = await updateConfig("lobby-1", {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: false,
        trialsPerDay: 1,
        revealProtections: true,
        hiddenRoleCount: 0,
        showRolesOnDeath: true,
        autoRevealNightOutcome: true,
      },
    });

    expect(
      (updated!.config.modeConfig as WerewolfModeConfig).nominationsEnabled,
    ).toBe(false);
  });

  it("a subsequent getLobby reflects the updated nominationsEnabled", async () => {
    await addLobby(
      makeBaseLobby({
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          trialsPerDay: 1,
          revealProtections: true,
          hiddenRoleCount: 0,
          showRolesOnDeath: true,
          autoRevealNightOutcome: true,
        },
      }),
    );
    await updateConfig("lobby-1", {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: false,
        trialsPerDay: 1,
        revealProtections: true,
        hiddenRoleCount: 0,
        showRolesOnDeath: true,
        autoRevealNightOutcome: true,
      },
    });

    const fetched = await getLobby("lobby-1");

    expect(
      (fetched!.config.modeConfig as WerewolfModeConfig).nominationsEnabled,
    ).toBe(false);
  });

  it("omitting modeConfig leaves existing modeConfig intact", async () => {
    await addLobby(
      makeBaseLobby({
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          trialsPerDay: 1,
          revealProtections: true,
          hiddenRoleCount: 0,
          showRolesOnDeath: true,
          autoRevealNightOutcome: true,
        },
      }),
    );

    const updated = await updateConfig("lobby-1", {
      showConfigToPlayers: true,
    });

    expect(
      (updated!.config.modeConfig as WerewolfModeConfig).nominationsEnabled,
    ).toBe(true);
  });

  it("returns undefined when the lobby does not exist", async () => {
    const result = await updateConfig("no-such-lobby", {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        trialsPerDay: 1,
        revealProtections: true,
        hiddenRoleCount: 0,
        showRolesOnDeath: true,
        autoRevealNightOutcome: true,
      },
    });

    expect(result).toBeUndefined();
  });
});

describe("toggleReady — countdown", () => {
  it("sets countdownStartedAt when all players become ready", async () => {
    await addLobby({ ...makeBaseLobby(), id: "lobby-countdown-1" });
    await addPlayer("lobby-countdown-1", {
      id: "player2",
      name: "Player 2",
      sessionId: "session-2",
    });

    await toggleReady("lobby-countdown-1", "owner");
    await toggleReady("lobby-countdown-1", "player2");

    const lobby = await getLobby("lobby-countdown-1");
    expect(lobby!.countdownStartedAt).toBeDefined();
  });

  it("clears countdownStartedAt when a player unreadies", async () => {
    await addLobby({ ...makeBaseLobby(), id: "lobby-countdown-2" });
    await addPlayer("lobby-countdown-2", {
      id: "player2",
      name: "Player 2",
      sessionId: "session-2",
    });
    await toggleReady("lobby-countdown-2", "owner");
    await toggleReady("lobby-countdown-2", "player2");

    await toggleReady("lobby-countdown-2", "player2");

    const lobby = await getLobby("lobby-countdown-2");
    expect(lobby!.countdownStartedAt).toBeUndefined();
  });

  it("sets countdownStartedAt without owner readying when only device players are eligible", async () => {
    await addLobby({ ...makeBaseLobby(), id: "lobby-countdown-4" });
    await addPlayer("lobby-countdown-4", {
      id: "player2",
      name: "Player 2",
      sessionId: "session-2",
    });

    // Only player2 needs to ready — owner is implicitly ready
    await toggleReady("lobby-countdown-4", "player2");

    const lobby = await getLobby("lobby-countdown-4");
    expect(lobby!.countdownStartedAt).toBeDefined();
  });

  it("does not set countdownStartedAt when all players are no-device (no eligible players)", async () => {
    await addLobby({ ...makeBaseLobby(), id: "lobby-countdown-5" });
    await addPlayer("lobby-countdown-5", {
      id: "player-no-device",
      name: "No Device",
      noDevice: true,
    });

    // No eligible players: owner and no-device are both excluded.
    // readyEligiblePlayerIds is empty so allReady condition (length >= 1) is never satisfied.
    await toggleReady("lobby-countdown-5", "owner");

    const lobby = await getLobby("lobby-countdown-5");
    expect(lobby!.countdownStartedAt).toBeUndefined();
  });
});

describe("removePlayer — countdown", () => {
  it("clears countdownStartedAt when a player leaves during an active countdown", async () => {
    await addLobby({ ...makeBaseLobby(), id: "lobby-countdown-3" });
    await addPlayer("lobby-countdown-3", {
      id: "player2",
      name: "Player 2",
      sessionId: "session-2",
    });
    await toggleReady("lobby-countdown-3", "owner");
    await toggleReady("lobby-countdown-3", "player2");

    await removePlayer("lobby-countdown-3", "player2");

    const lobby = await getLobby("lobby-countdown-3");
    expect(lobby!.countdownStartedAt).toBeUndefined();
  });
});
