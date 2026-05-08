import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import { SpecialBadRevealView } from "./SpecialBadRevealView";

afterEach(cleanup);

const copy = SECRET_VILLAIN_COPY.specialBadReveal;

const defaultProps = {
  chancellorName: "Alice",
  specialBadRoleName: "Hitler",
  badTeamLabel: "Fascist",
  badTrackLabel: "Fascist Policies",
  isChancellor: false,
  onConfirm: vi.fn(),
  onReveal: vi.fn(),
  onContinue: vi.fn(),
};

describe("SpecialBadRevealView", () => {
  it("shows waiting message for non-chancellor before chancellor acts", () => {
    const { container } = render(<SpecialBadRevealView {...defaultProps} />);
    expect(container.textContent).toContain(copy.waitingMessage("Alice"));
  });

  it("shows chancellor decision UI when isChancellor is true", () => {
    const { container } = render(
      <SpecialBadRevealView {...defaultProps} isChancellor={true} />,
    );
    expect(container.textContent).toContain(copy.chancellorHeading);
    expect(container.textContent).toContain(copy.confirmButton("Hitler"));
    expect(container.textContent).toContain(copy.revealButton("Hitler"));
  });

  it("shows confirmed outcome after chancellor denies (revealed = false)", () => {
    const { container } = render(
      <SpecialBadRevealView {...defaultProps} revealed={false} />,
    );
    expect(container.textContent).toContain(
      copy.outcomeConfirmed("Alice", "Hitler"),
    );
    expect(container.textContent).toContain(copy.continueButton);
  });

  it("shows revealed outcome after chancellor reveals (revealed = true)", () => {
    const { container } = render(
      <SpecialBadRevealView {...defaultProps} revealed={true} />,
    );
    expect(container.textContent).toContain(
      copy.outcomeRevealed("Alice", "Hitler", "Fascist"),
    );
    expect(container.textContent).toContain(copy.continueButton);
  });
});
