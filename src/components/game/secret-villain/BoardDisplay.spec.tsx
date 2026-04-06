import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BoardDisplay } from "./BoardDisplay";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";

afterEach(cleanup);

const defaultProps = {
  goodCardsPlayed: 0,
  badCardsPlayed: 0,
  failedElectionCount: 0,
  failedElectionThreshold: 3,
};

describe("BoardDisplay", () => {
  it("renders correct number of filled good slots", () => {
    render(<BoardDisplay {...defaultProps} goodCardsPlayed={3} />);
    const filledGood = screen
      .getAllByTestId(/^good-slot-/)
      .filter((el) => el.getAttribute("data-filled") === "true");
    expect(filledGood).toHaveLength(3);
  });

  it("renders correct number of filled bad slots", () => {
    render(<BoardDisplay {...defaultProps} badCardsPlayed={2} />);
    const filledBad = screen
      .getAllByTestId(/^bad-slot-/)
      .filter((el) => el.getAttribute("data-filled") === "true");
    expect(filledBad).toHaveLength(2);
  });

  it("shows veto badge when vetoUnlocked is true", () => {
    render(<BoardDisplay {...defaultProps} vetoUnlocked={true} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.board.vetoUnlocked),
    ).toBeDefined();
  });

  it("does not show veto badge when vetoUnlocked is false", () => {
    render(<BoardDisplay {...defaultProps} vetoUnlocked={false} />);
    expect(
      screen.queryByText(SECRET_VILLAIN_COPY.board.vetoUnlocked),
    ).toBeNull();
  });

  it("renders failed election dots", () => {
    render(
      <BoardDisplay
        {...defaultProps}
        failedElectionCount={2}
        failedElectionThreshold={3}
      />,
    );
    const filledDots = screen
      .getAllByTestId(/^election-dot-/)
      .filter((el) => el.getAttribute("data-filled") === "true");
    expect(filledDots).toHaveLength(2);
  });
});
