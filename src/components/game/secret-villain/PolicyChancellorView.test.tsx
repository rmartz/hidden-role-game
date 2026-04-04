import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PolicyChancellorView } from "./PolicyChancellorView";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";

afterEach(cleanup);

const defaultProps = {
  remainingCards: ["good", "bad"] as string[],
  onSelectCard: vi.fn(),
  onPlay: vi.fn(),
  isChancellor: true,
  chancellorName: "TestChancellor",
};

describe("PolicyChancellorView", () => {
  it("shows 2 card buttons when chancellor", () => {
    render(<PolicyChancellorView {...defaultProps} />);
    const goodButtons = screen.getAllByText(
      SECRET_VILLAIN_COPY.policy.goodCard,
    );
    const badButtons = screen.getAllByText(SECRET_VILLAIN_COPY.policy.badCard);
    expect(goodButtons.length + badButtons.length).toBe(2);
  });

  it("shows veto button when veto is unlocked", () => {
    render(
      <PolicyChancellorView
        {...defaultProps}
        vetoUnlocked={true}
        onProposeVeto={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: SECRET_VILLAIN_COPY.policy.proposeVeto,
      }),
    ).toBeDefined();
  });

  it("hides veto button when veto is not unlocked", () => {
    render(<PolicyChancellorView {...defaultProps} />);
    expect(
      screen.queryByRole("button", {
        name: SECRET_VILLAIN_COPY.policy.proposeVeto,
      }),
    ).toBeNull();
  });

  it("shows rejected text when veto was rejected", () => {
    render(
      <PolicyChancellorView
        {...defaultProps}
        vetoUnlocked={true}
        vetoProposed={true}
        vetoResponse={false}
        onProposeVeto={vi.fn()}
      />,
    );
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.policy.vetoRejected),
    ).toBeDefined();
  });

  it("shows waiting message when not chancellor", () => {
    render(<PolicyChancellorView {...defaultProps} isChancellor={false} />);
    expect(
      screen.getByText(
        SECRET_VILLAIN_COPY.policy.waitingForChancellor("TestChancellor"),
      ),
    ).toBeDefined();
  });

  it("shows waiting for president when veto proposed", () => {
    render(
      <PolicyChancellorView
        {...defaultProps}
        vetoUnlocked={true}
        vetoProposed={true}
        vetoResponse={undefined}
        onProposeVeto={vi.fn()}
      />,
    );
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.policy.vetoProposed),
    ).toBeDefined();
  });
});
