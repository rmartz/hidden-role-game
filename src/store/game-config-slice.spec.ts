import { describe, it, expect } from "vitest";
import { GameMode, RoleConfigMode } from "@/lib/types";
import reducer, {
  loadConfig,
  updateModeConfigField,
  setPlayerCount,
} from "./game-config-slice";
import type { GameConfigState } from "./game-config-slice";
import { ShowRolesInPlay } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_MODE_CONFIG } from "@/lib/game/modes/secret-villain/lobby-config";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import { GAME_MODES } from "@/lib/game/modes";

function makeSecretVillainState(
  playerCount: number,
  roleConfigMode = RoleConfigMode.Default,
): GameConfigState {
  const config = {
    gameMode: GameMode.SecretVillain,
    playerCount,
    roleConfigMode,
    roleSlots: GAME_MODES[GameMode.SecretVillain].defaultRoleCount(playerCount),
    showConfigToPlayers: false,
    showRolesInPlay: ShowRolesInPlay.None,
    timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
    modeConfig: DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
  };
  return reducer(undefined, loadConfig({ config, playerCount }));
}

function totalRoleCount(state: GameConfigState): number {
  return Object.values(state.roleCounts).reduce((a, b) => a + b, 0);
}

describe("game-config-slice — updateModeConfigField includeBoard with Default role config", () => {
  it("reduces role slot total by 1 when includeBoard is enabled", () => {
    const state = makeSecretVillainState(7);
    const before = totalRoleCount(state);

    const next = reducer(
      state,
      updateModeConfigField({ key: "includeBoard", value: true }),
    );

    expect(totalRoleCount(next)).toBe(before - 1);
  });

  it("restores role slot total when includeBoard is disabled", () => {
    const state = makeSecretVillainState(7);
    const before = totalRoleCount(state);

    const withBoard = reducer(
      state,
      updateModeConfigField({ key: "includeBoard", value: true }),
    );
    const restored = reducer(
      withBoard,
      updateModeConfigField({ key: "includeBoard", value: false }),
    );

    expect(totalRoleCount(restored)).toBe(before);
  });

  it("does not change role slots in Custom mode when includeBoard is toggled", () => {
    const state = makeSecretVillainState(7, RoleConfigMode.Custom);
    const before = totalRoleCount(state);

    const next = reducer(
      state,
      updateModeConfigField({ key: "includeBoard", value: true }),
    );

    expect(totalRoleCount(next)).toBe(before);
  });
});

describe("game-config-slice — setPlayerCount with Board enabled", () => {
  it("sets role slot total to playerCount - 1 when Board is enabled", () => {
    const state = makeSecretVillainState(7);
    const withBoard = reducer(
      state,
      updateModeConfigField({ key: "includeBoard", value: true }),
    );

    const next = reducer(withBoard, setPlayerCount(8));

    expect(totalRoleCount(next)).toBe(7);
  });

  it("sets role slot total to playerCount when Board is not enabled", () => {
    const state = makeSecretVillainState(7);

    const next = reducer(state, setPlayerCount(8));

    expect(totalRoleCount(next)).toBe(8);
  });
});
