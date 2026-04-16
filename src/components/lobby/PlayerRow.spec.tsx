import { afterEach, describe, it, expect, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { PlayerRow } from "./PlayerRow";
import { PLAYER_ROW_COPY } from "./PlayerRow.copy";
import type { PublicLobbyPlayer } from "@/server/types";

afterEach(cleanup);

const player: PublicLobbyPlayer = { id: "player-1", name: "Alice" };
const otherPlayer: PublicLobbyPlayer = { id: "player-2", name: "Bob" };

const defaultProps = {
  ownerPlayerId: "player-1",
  isReady: false,
  showLeave: true,
  showRemovePlayer: false,
  showMakeOwner: false,
  disabled: false,
  isRenamePending: false,
  onRemovePlayer: vi.fn(),
  onTransferOwner: vi.fn(),
  onRenamePlayer: vi.fn(),
};

describe("PlayerRow", () => {
  it("renders the player name", () => {
    render(
      <ul>
        <PlayerRow {...defaultProps} player={player} isCurrentUser={true} />
      </ul>,
    );
    expect(screen.getByText("Alice")).toBeDefined();
  });

  it("shows Rename button for the current user", () => {
    render(
      <ul>
        <PlayerRow {...defaultProps} player={player} isCurrentUser={true} />
      </ul>,
    );
    expect(screen.getByText(PLAYER_ROW_COPY.renameButton)).toBeDefined();
  });

  it("does not show Rename button for other players", () => {
    render(
      <ul>
        <PlayerRow
          {...defaultProps}
          player={otherPlayer}
          isCurrentUser={false}
        />
      </ul>,
    );
    expect(screen.queryByText(PLAYER_ROW_COPY.renameButton)).toBeNull();
  });

  it("disables the Rename button when disabled is true", () => {
    render(
      <ul>
        <PlayerRow
          {...defaultProps}
          player={player}
          isCurrentUser={true}
          disabled={true}
        />
      </ul>,
    );
    const renameButton = screen
      .getByText(PLAYER_ROW_COPY.renameButton)
      .closest("button");
    expect(renameButton?.getAttribute("disabled")).not.toBeNull();
  });

  it("disables the Rename button while rename is pending", () => {
    render(
      <ul>
        <PlayerRow
          {...defaultProps}
          player={player}
          isCurrentUser={true}
          isRenamePending={true}
        />
      </ul>,
    );
    const renameButton = screen
      .getByText(PLAYER_ROW_COPY.renameButton)
      .closest("button");
    expect(renameButton?.getAttribute("disabled")).not.toBeNull();
  });

  it("shows Remove button for non-current users when showRemovePlayer is true", () => {
    render(
      <ul>
        <PlayerRow
          {...defaultProps}
          player={otherPlayer}
          isCurrentUser={false}
          showRemovePlayer={true}
        />
      </ul>,
    );
    expect(screen.getByText(PLAYER_ROW_COPY.removeButton)).toBeDefined();
  });

  it("does not show Remove button for the current user", () => {
    render(
      <ul>
        <PlayerRow
          {...defaultProps}
          player={player}
          isCurrentUser={true}
          showRemovePlayer={true}
        />
      </ul>,
    );
    expect(screen.queryByText(PLAYER_ROW_COPY.removeButton)).toBeNull();
  });

  it("shows Make Owner button for non-current users when showMakeOwner is true", () => {
    render(
      <ul>
        <PlayerRow
          {...defaultProps}
          player={otherPlayer}
          isCurrentUser={false}
          showMakeOwner={true}
        />
      </ul>,
    );
    expect(screen.getByText(PLAYER_ROW_COPY.makeOwnerButton)).toBeDefined();
  });

  it("calls onRenamePlayer when the rename dialog is confirmed", () => {
    const onRenamePlayer = vi.fn();
    render(
      <ul>
        <PlayerRow
          {...defaultProps}
          player={player}
          isCurrentUser={true}
          onRenamePlayer={onRenamePlayer}
        />
      </ul>,
    );
    fireEvent.click(screen.getByText(PLAYER_ROW_COPY.renameButton));
    const dialog = screen.getByRole("alertdialog");
    const input = within(dialog).getByPlaceholderText(
      PLAYER_ROW_COPY.renamePlaceholder,
    );
    fireEvent.change(input, { target: { value: "Alice Renamed" } });
    fireEvent.click(within(dialog).getByText(PLAYER_ROW_COPY.renameConfirm));
    expect(onRenamePlayer).toHaveBeenCalledWith("Alice Renamed");
  });

  it("pre-fills the rename input with the current player name", () => {
    render(
      <ul>
        <PlayerRow {...defaultProps} player={player} isCurrentUser={true} />
      </ul>,
    );
    fireEvent.click(screen.getByText(PLAYER_ROW_COPY.renameButton));
    const dialog = screen.getByRole("alertdialog");
    const input = within(dialog).getByPlaceholderText(
      PLAYER_ROW_COPY.renamePlaceholder,
    );
    expect((input as HTMLInputElement).value).toBe("Alice");
  });

  it("disables confirm when the rename input is empty", () => {
    render(
      <ul>
        <PlayerRow {...defaultProps} player={player} isCurrentUser={true} />
      </ul>,
    );
    fireEvent.click(screen.getByText(PLAYER_ROW_COPY.renameButton));
    const dialog = screen.getByRole("alertdialog");
    const input = within(dialog).getByPlaceholderText(
      PLAYER_ROW_COPY.renamePlaceholder,
    );
    fireEvent.change(input, { target: { value: "" } });
    const confirmButton = within(dialog)
      .getByText(PLAYER_ROW_COPY.renameConfirm)
      .closest("button");
    expect(confirmButton?.getAttribute("disabled")).not.toBeNull();
  });
});
