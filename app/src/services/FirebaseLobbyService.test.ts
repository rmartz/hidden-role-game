import { describe, it, expect } from "vitest";
import { FirebaseLobbyService } from "./FirebaseLobbyService";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import type { Lobby } from "@/lib/types";

function makeBaseLobby(overrides: Partial<Lobby["config"]> = {}): Lobby {
  return {
    id: "lobby-1",
    ownerSessionId: "session-owner",
    players: [{ id: "owner", name: "Owner", sessionId: "session-owner" }],
    config: {
      gameMode: GameMode.Werewolf,
      roleConfigMode: RoleConfigMode.Manual,
      roleSlots: [],
      showConfigToPlayers: false,
      showRolesInPlay: ShowRolesInPlay.None,
      ...overrides,
    },
  };
}

describe("FirebaseLobbyService.updateConfig — nominationThreshold", () => {
  it("sets nominationThreshold when a value is provided", async () => {
    const service = new FirebaseLobbyService();
    await service.addLobby(makeBaseLobby());

    const updated = await service.updateConfig("lobby-1", {
      nominationThreshold: 2,
    });

    expect(updated?.config.nominationThreshold).toBe(2);
  });

  it("removing nominationThreshold with null deletes it from Firebase", async () => {
    const service = new FirebaseLobbyService();
    await service.addLobby(makeBaseLobby({ nominationThreshold: 2 }));

    const updated = await service.updateConfig("lobby-1", {
      nominationThreshold: null,
    });

    expect(updated?.config.nominationThreshold).toBeUndefined();
  });

  it("a subsequent getLobby does not return the deleted nominationThreshold", async () => {
    const service = new FirebaseLobbyService();
    await service.addLobby(makeBaseLobby({ nominationThreshold: 2 }));
    await service.updateConfig("lobby-1", { nominationThreshold: null });

    const fetched = await service.getLobby("lobby-1");

    expect(fetched?.config.nominationThreshold).toBeUndefined();
  });

  it("omitting nominationThreshold leaves an existing value intact", async () => {
    const service = new FirebaseLobbyService();
    await service.addLobby(makeBaseLobby({ nominationThreshold: 2 }));

    const updated = await service.updateConfig("lobby-1", {
      showConfigToPlayers: true,
    });

    expect(updated?.config.nominationThreshold).toBe(2);
  });

  it("returns undefined when the lobby does not exist", async () => {
    const service = new FirebaseLobbyService();

    const result = await service.updateConfig("no-such-lobby", {
      nominationThreshold: 2,
    });

    expect(result).toBeUndefined();
  });
});
