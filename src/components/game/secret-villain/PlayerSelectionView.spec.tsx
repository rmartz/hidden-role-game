import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PlayerSelectionView } from "./PlayerSelectionView";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";

afterEach(cleanup);

const players = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
];

const defaultProps = {
  heading: SECRET_VILLAIN_COPY.specialAction.investigateHeading,
  instructions: SECRET_VILLAIN_COPY.specialAction.investigateInstructions,
  confirmLabel: SECRET_VILLAIN_COPY.specialAction.investigateConfirm,
  players,
  onSelectPlayer: vi.fn(),
  onConfirm: vi.fn(),
};

describe("PlayerSelectionView", () => {
  it("renders player buttons", () => {
    render(<PlayerSelectionView {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Alice" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Bob" })).toBeDefined();
  });

  it("confirm button is disabled without selection", () => {
    render(<PlayerSelectionView {...defaultProps} />);
    const confirmButton = screen.getByRole("button", {
      name: SECRET_VILLAIN_COPY.specialAction.investigateConfirm,
    });
    expect(confirmButton.hasAttribute("disabled")).toBe(true);
  });

  it("shows heading and instructions", () => {
    render(<PlayerSelectionView {...defaultProps} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.specialAction.investigateHeading),
    ).toBeDefined();
    expect(
      screen.getByText(
        SECRET_VILLAIN_COPY.specialAction.investigateInstructions,
      ),
    ).toBeDefined();
  });
});
