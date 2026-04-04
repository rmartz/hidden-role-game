import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { InvestigationConsentView } from "./InvestigationConsentView";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";

afterEach(cleanup);

const defaultProps = {
  presidentName: "Alice",
};

describe("InvestigationConsentView", () => {
  it("shows president name in consent message", () => {
    render(<InvestigationConsentView {...defaultProps} />);
    expect(
      screen.getByText(
        SECRET_VILLAIN_COPY.specialAction.investigateConsent("Alice"),
      ),
    ).toBeDefined();
  });

  it("shows Reveal button when onConsent is provided", () => {
    render(<InvestigationConsentView {...defaultProps} onConsent={vi.fn()} />);
    expect(
      screen.getByRole("button", {
        name: SECRET_VILLAIN_COPY.specialAction.investigateReveal,
      }),
    ).toBeDefined();
  });

  it("button is disabled when isPending is true", () => {
    render(
      <InvestigationConsentView
        {...defaultProps}
        onConsent={vi.fn()}
        isPending={true}
      />,
    );
    const button = screen.getByRole("button", {
      name: SECRET_VILLAIN_COPY.specialAction.investigateReveal,
    });
    expect(button.hasAttribute("disabled")).toBe(true);
  });
});
