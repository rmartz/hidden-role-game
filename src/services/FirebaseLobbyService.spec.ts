import { describe, it, expect } from "vitest";
import { FirebaseLobbyService } from "./FirebaseLobbyService";
import {
  GameMode,
  RoleConfigMode,
  ShowRolesInPlay,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import type { Lobby } from "@/lib/types";
import type { WerewolfModeConfig } from "@/lib/game-modes/werewolf/lobby-config";

function makeBaseLobby(overrides: Partial<Lobby["config"]> = {}): Lobby {
  return {
    id: "lobby-1",
    ownerSessionId: "session-owner",
    players: [{ id: "owner", name: "Owner", sessionId: "session-owner" }],
    readyPlayerIds: [],
    config: {
      gameMode: GameMode.Werewolf,
      roleConfigMode: RoleConfigMode.Custom,
      roleSlots: [],
      showConfigToPlayers: false,
      showRolesInPlay: ShowRolesInPlay.None,
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: false,
        singleTrialPerDay: true,
        revealProtections: true,
      },
      timerConfig: DEFAULT_TIMER_CONFIG,
      ...overrides,
    },
  };
}

describe("FirebaseLobbyService.updateConfig — nominationsEnabled", () => {
  it("sets nominationsEnabled when true is provided", async () => {
    const service = new FirebaseLobbyService();
    await service.addLobby(makeBaseLobby());

    const updated = await service.updateConfig("lobby-1", {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        singleTrialPerDay: true,
        revealProtections: true,
      },
    });

    expect(
      (updated!.config.modeConfig as WerewolfModeConfig).nominationsEnabled,
    ).toBe(true);
  });

  it("sets nominationsEnabled to false when false is provided", async () => {
    const service = new FirebaseLobbyService();
    await service.addLobby(
      makeBaseLobby({
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          singleTrialPerDay: true,
          revealProtections: true,
        },
      }),
    );

    const updated = await service.updateConfig("lobby-1", {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: false,
        singleTrialPerDay: true,
        revealProtections: true,
      },
    });

    expect(
      (updated!.config.modeConfig as WerewolfModeConfig).nominationsEnabled,
    ).toBe(false);
  });

  it("a subsequent getLobby reflects the updated nominationsEnabled", async () => {
    const service = new FirebaseLobbyService();
    await service.addLobby(
      makeBaseLobby({
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          singleTrialPerDay: true,
          revealProtections: true,
        },
      }),
    );
    await service.updateConfig("lobby-1", {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: false,
        singleTrialPerDay: true,
        revealProtections: true,
      },
    });

    const fetched = await service.getLobby("lobby-1");

    expect(
      (fetched!.config.modeConfig as WerewolfModeConfig).nominationsEnabled,
    ).toBe(false);
  });

  it("omitting modeConfig leaves existing modeConfig intact", async () => {
    const service = new FirebaseLobbyService();
    await service.addLobby(
      makeBaseLobby({
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: true,
          singleTrialPerDay: true,
          revealProtections: true,
        },
      }),
    );

    const updated = await service.updateConfig("lobby-1", {
      showConfigToPlayers: true,
    });

    expect(
      (updated!.config.modeConfig as WerewolfModeConfig).nominationsEnabled,
    ).toBe(true);
  });

  it("returns undefined when the lobby does not exist", async () => {
    const service = new FirebaseLobbyService();

    const result = await service.updateConfig("no-such-lobby", {
      modeConfig: {
        gameMode: GameMode.Werewolf,
        nominationsEnabled: true,
        singleTrialPerDay: true,
        revealProtections: true,
      },
    });

    expect(result).toBeUndefined();
  });
});
