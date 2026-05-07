import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import type { PublicLobby } from "@/server/types";
import { PlayerList } from "./PlayerList";
import { PLAYER_LIST_COPY } from "./PlayerList.copy";

vi.mock("./PlayerRow", () => ({
  PlayerRow: () => <li>player-row</li>,
}));

afterEach(cleanup);

const baseLobby: PublicLobby = {
  id: "lobby-abc",
  ownerPlayerId: "p1",
  players: [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
    { id: "p3", name: "Charlie" },
  ],
  playerOrder: ["p1", "p2", "p3"],
  config: {
    gameMode: GameMode.Werewolf,
    roleConfigMode: RoleConfigMode.Default,
    showConfigToPlayers: true,
    showRolesInPlay: ShowRolesInPlay.AssignedRolesOnly,
    roleBuckets: [],
    timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
    modeConfig: {
      gameMode: GameMode.Werewolf,
      nominationsEnabled: true,
      trialsPerDay: 1,
      revealProtections: true,
      hiddenRoleCount: 0,
      showRolesOnDeath: true,
      autoRevealNightOutcome: true,
    },
  },
  readyPlayerIds: [],
};

const noop = vi.fn();

const defaultProps = {
  userPlayerId: "p1",
  isOwner: true,
  showLeave: false,
  showRemovePlayer: true,
  showMakeOwner: true,
  showRefresh: false,
  isFetching: false,
  disabled: false,
  isReadyPending: false,
  isRenamePending: false,
  isOwnerRenamePending: false,
  isAddNoDevicePending: false,
  countdownDurationSeconds: 5,
  onRefetch: noop,
  onRemovePlayer: noop,
  onTransferOwner: noop,
  onRenamePlayer: noop,
  onRenameNoDevicePlayer: noop,
  onAddNoDevicePlayer: noop,
  onToggleReady: noop,
};

describe("PlayerList", () => {
  it("shows countdown prefix text when countdown is active", () => {
    const { container } = render(
      <PlayerList
        {...defaultProps}
        lobby={{
          ...baseLobby,
          readyPlayerIds: ["p1", "p2", "p3"],
          countdownStartedAt: Date.now() - 1000,
        }}
      />,
    );
    expect(container.textContent).toContain(PLAYER_LIST_COPY.countdownPrefix);
  });

  it("shows allPlayersReady copy to owner when all non-owner players are ready and no countdown", () => {
    const { container } = render(
      <PlayerList
        {...defaultProps}
        isOwner={true}
        userPlayerId="p1"
        lobby={{ ...baseLobby, readyPlayerIds: ["p2", "p3"] }}
      />,
    );
    expect(container.textContent).toContain(PLAYER_LIST_COPY.allPlayersReady);
  });

  it("shows waitingForHost copy to non-owner when all non-owner players are ready and no countdown", () => {
    const { container } = render(
      <PlayerList
        {...defaultProps}
        isOwner={false}
        userPlayerId="p2"
        lobby={{ ...baseLobby, readyPlayerIds: ["p2", "p3"] }}
      />,
    );
    expect(container.textContent).toContain(PLAYER_LIST_COPY.waitingForHost);
  });

  it("shows add-no-device button for the owner", () => {
    const { container } = render(
      <PlayerList
        {...defaultProps}
        isOwner={true}
        userPlayerId="p1"
        lobby={baseLobby}
      />,
    );
    expect(container.textContent).toContain(PLAYER_LIST_COPY.addNoDeviceButton);
  });

  it("shows Not Ready button when current user is already ready", () => {
    const { container } = render(
      <PlayerList
        {...defaultProps}
        isOwner={false}
        userPlayerId="p2"
        lobby={{ ...baseLobby, readyPlayerIds: ["p2"] }}
      />,
    );
    expect(container.textContent).toContain(PLAYER_LIST_COPY.notReadyButton);
  });
});
