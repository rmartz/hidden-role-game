import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PolicyPresidentView } from "./PolicyPresidentView";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";

afterEach(cleanup);

const defaultProps = {
  drawnCards: ["good", "bad", "bad"] as string[],
  cardsRevealed: true,
  onSelectCard: vi.fn(),
  onDraw: vi.fn(),
  onDiscard: vi.fn(),
  isPresident: true,
  presidentName: "TestPresident",
};

describe("PolicyPresidentView", () => {
  it("shows Draw button before cards are revealed", () => {
    render(
      <PolicyPresidentView
        {...defaultProps}
        drawnCards={[]}
        cardsRevealed={false}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: SECRET_VILLAIN_COPY.policy.presidentDraw,
      }),
    ).toBeDefined();
  });

  it("does not show cards before drawing", () => {
    render(
      <PolicyPresidentView
        {...defaultProps}
        drawnCards={[]}
        cardsRevealed={false}
      />,
    );
    expect(screen.queryByText(SECRET_VILLAIN_COPY.policy.goodCard)).toBeNull();
    expect(screen.queryByText(SECRET_VILLAIN_COPY.policy.badCard)).toBeNull();
  });

  it("shows 3 card columns after drawing", () => {
    render(<PolicyPresidentView {...defaultProps} />);
    expect(screen.getAllByTestId(/^policy-card-column-/)).toHaveLength(3);
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
