import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PolicyPresidentView } from "./PolicyPresidentView";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";

afterEach(cleanup);

const defaultProps = {
  drawnCards: ["good", "bad", "bad"] as string[],
  onSelectCard: vi.fn(),
  onDiscard: vi.fn(),
  isPresident: true,
  presidentName: "TestPresident",
};

describe("PolicyPresidentView", () => {
  it("shows 3 card buttons when president", () => {
    render(<PolicyPresidentView {...defaultProps} />);
    const goodButtons = screen.getAllByText(
      SECRET_VILLAIN_COPY.policy.goodCard,
    );
    const badButtons = screen.getAllByText(SECRET_VILLAIN_COPY.policy.badCard);
    expect(goodButtons.length + badButtons.length).toBe(3);
  });

  it("shows waiting message when not president", () => {
    render(<PolicyPresidentView {...defaultProps} isPresident={false} />);
    expect(
      screen.getByText(
        SECRET_VILLAIN_COPY.policy.waitingForPresident("TestPresident"),
      ),
    ).toBeDefined();
  });

  it("discard button is disabled without selection", () => {
    render(<PolicyPresidentView {...defaultProps} />);
    const discardButton = screen.getByRole("button", {
      name: SECRET_VILLAIN_COPY.policy.discard,
    });
    expect(discardButton.hasAttribute("disabled")).toBe(true);
  });

  it("discard button is enabled with selection", () => {
    render(<PolicyPresidentView {...defaultProps} selectedIndex={0} />);
    const discardButton = screen.getByRole("button", {
      name: SECRET_VILLAIN_COPY.policy.discard,
    });
    expect(discardButton.hasAttribute("disabled")).toBe(false);
  });
});
