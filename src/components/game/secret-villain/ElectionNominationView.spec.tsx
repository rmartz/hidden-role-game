import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ElectionNominationView } from "./ElectionNominationView";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";

afterEach(cleanup);

const eligiblePlayers = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
];

const defaultProps = {
  presidentName: "TestPresident",
  eligiblePlayers,
  onSelectPlayer: vi.fn(),
  onConfirm: vi.fn(),
  isPresident: true,
};

describe("ElectionNominationView", () => {
  it("shows select chancellor text when isPresident", () => {
    render(<ElectionNominationView {...defaultProps} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.election.selectChancellor),
    ).toBeDefined();
  });

  it("shows waiting message when not president", () => {
    render(<ElectionNominationView {...defaultProps} isPresident={false} />);
    expect(
      screen.getByText(
        SECRET_VILLAIN_COPY.election.nominationInstructions("TestPresident"),
      ),
    ).toBeDefined();
  });

  it("confirm button is disabled without selection", () => {
    render(<ElectionNominationView {...defaultProps} />);
    const confirmButton = screen.getByRole("button", {
      name: SECRET_VILLAIN_COPY.election.confirmNomination,
    });
    expect(confirmButton.hasAttribute("disabled")).toBe(true);
  });

  it("confirm button is enabled with selection", () => {
    render(<ElectionNominationView {...defaultProps} selectedPlayerId="p1" />);
    const confirmButton = screen.getByRole("button", {
      name: SECRET_VILLAIN_COPY.election.confirmNomination,
    });
    expect(confirmButton.hasAttribute("disabled")).toBe(false);
  });
});
