import { describe, it, expect } from "vitest";
import { addLobby, getLobby, updateConfig } from "./lobby";
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
