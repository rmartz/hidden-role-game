import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PolicyPeekView } from "./PolicyPeekView";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";

afterEach(cleanup);

const defaultProps = {
  peekedCards: ["good", "bad", "bad"],
  onConfirm: vi.fn(),
};

describe("PolicyPeekView", () => {
  it("renders correct number of cards", () => {
    render(<PolicyPeekView {...defaultProps} />);
    const goodCards = screen.getAllByText(SECRET_VILLAIN_COPY.policy.goodCard);
    const badCards = screen.getAllByText(SECRET_VILLAIN_COPY.policy.badCard);
    expect(goodCards.length + badCards.length).toBe(3);
  });

  it("shows Done button", () => {
    render(<PolicyPeekView {...defaultProps} />);
    expect(
      screen.getByRole("button", {
        name: SECRET_VILLAIN_COPY.specialAction.policyPeekConfirm,
      }),
    ).toBeDefined();
  });

  it("button is disabled when isPending", () => {
    render(<PolicyPeekView {...defaultProps} isPending={true} />);
    const button = screen.getByRole("button", {
      name: SECRET_VILLAIN_COPY.specialAction.policyPeekConfirm,
    });
    expect(button.hasAttribute("disabled")).toBe(true);
  });
});
