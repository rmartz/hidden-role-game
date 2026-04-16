import { describe, it, expect } from "vitest";
import { validateGameStartPrerequisites } from "./game";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import type { Lobby } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import { DEFAULT_SECRET_VILLAIN_MODE_CONFIG } from "@/lib/game/modes/secret-villain/lobby-config";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";

function makeLobby(overrides: Partial<Lobby> = {}): Lobby {
  return {
    id: "lobby-1",
    ownerSessionId: "session-owner",
    players: [
      { id: "player-1", name: "Alice", sessionId: "session-owner" },
      { id: "player-2", name: "Bob", sessionId: "session-bob" },
    ],
    playerOrder: ["player-1", "player-2"],
    config: {
      gameMode: GameMode.SecretVillain,
      roleConfigMode: RoleConfigMode.Default,
      roleBuckets: [],
      showConfigToPlayers: false,
      showRolesInPlay: ShowRolesInPlay.None,
      modeConfig: DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
      timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    },
    readyPlayerIds: [],
    ...overrides,
  };
}

describe("validateGameStartPrerequisites", () => {
  it("returns an error when the requested game mode does not match the lobby config", () => {
    const lobby = makeLobby();
    // lobby.config.gameMode is SecretVillain; request is Werewolf
    const result = validateGameStartPrerequisites(lobby, GameMode.Werewolf);
    expect("error" in result).toBe(true);
  });

  it("returns ownerPlayerId as undefined for a mode without an owner role (SecretVillain)", () => {
    const lobby = makeLobby();
    const result = validateGameStartPrerequisites(
      lobby,
      GameMode.SecretVillain,
    );
    expect("error" in result).toBe(false);
    expect(
      (result as { ownerPlayerId: string | undefined }).ownerPlayerId,
    ).toBeUndefined();
  });

  it("returns the owner's player ID for a mode with an owner role (Werewolf)", () => {
    const lobby = makeLobby({
      config: {
        gameMode: GameMode.Werewolf,
        roleConfigMode: RoleConfigMode.Default,
        roleBuckets: [],
        showConfigToPlayers: false,
        showRolesInPlay: ShowRolesInPlay.None,
        modeConfig: {
          gameMode: GameMode.Werewolf,
          nominationsEnabled: false,
          singleTrialPerDay: false,
          revealProtections: false,
          showRolesOnDeath: true,
        },
        timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
      },
    });
    const result = validateGameStartPrerequisites(lobby, GameMode.Werewolf);
    expect("error" in result).toBe(false);
    // owner session is "session-owner" → player-1
    expect(
      (result as { ownerPlayerId: string | undefined }).ownerPlayerId,
    ).toBe("player-1");
  });
});
