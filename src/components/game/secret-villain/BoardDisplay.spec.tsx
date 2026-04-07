import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BoardDisplay } from "./BoardDisplay";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import {
  BAD_CARDS_TO_WIN,
  GOOD_CARDS_TO_WIN,
  SpecialActionType,
} from "@/lib/game/modes/secret-villain/types";

afterEach(cleanup);

const defaultPowerTable = [
  undefined,
  undefined,
  SpecialActionType.InvestigateTeam,
  SpecialActionType.Shoot,
  SpecialActionType.Shoot,
];

const defaultProps = {
  goodCardsPlayed: 0,
  badCardsPlayed: 0,
  failedElectionCount: 0,
  failedElectionThreshold: 3,
  powerTable: defaultPowerTable,
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

  it("renders the correct number of bad and good slots", () => {
    render(<BoardDisplay {...defaultProps} />);
    expect(screen.getAllByTestId(/^bad-slot-\d+$/)).toHaveLength(
      BAD_CARDS_TO_WIN,
    );
    expect(screen.getAllByTestId(/^good-slot-\d+$/)).toHaveLength(
      GOOD_CARDS_TO_WIN,
    );
  });

  it("marks the last bad slot as final", () => {
    render(<BoardDisplay {...defaultProps} />);
    const badSlots = screen.getAllByTestId(/^bad-slot-\d+$/);
    const lastBadSlot = badSlots[badSlots.length - 1];
    if (!lastBadSlot) throw new Error("No bad slots rendered");
    expect(lastBadSlot.getAttribute("data-final")).toBe("true");
  });

  it("marks the last good slot as final", () => {
    render(<BoardDisplay {...defaultProps} />);
    const goodSlots = screen.getAllByTestId(/^good-slot-\d+$/);
    const lastGoodSlot = goodSlots[goodSlots.length - 1];
    if (!lastGoodSlot) throw new Error("No good slots rendered");
    expect(lastGoodSlot.getAttribute("data-final")).toBe("true");
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

  it("renders power labels for each bad slot when powerTable is provided", () => {
    const powerTable = [
      undefined,
      undefined,
      SpecialActionType.PolicyPeek,
      SpecialActionType.Shoot,
      SpecialActionType.Shoot,
    ];
    render(<BoardDisplay {...defaultProps} powerTable={powerTable} />);
    expect(screen.getByTestId("bad-slot-label-2").textContent).toBe(
      SECRET_VILLAIN_COPY.board.powerLabels[SpecialActionType.PolicyPeek],
    );
    expect(screen.getByTestId("bad-slot-label-3").textContent).toBe(
      SECRET_VILLAIN_COPY.board.powerLabels[SpecialActionType.Shoot],
    );
  });

  it("does not render labels for undefined power table slots", () => {
    const powerTable = [
      undefined,
      SpecialActionType.InvestigateTeam,
      undefined,
      SpecialActionType.Shoot,
      SpecialActionType.Shoot,
    ];
    render(<BoardDisplay {...defaultProps} powerTable={powerTable} />);
    expect(screen.queryByTestId("bad-slot-label-0")).toBeNull();
    expect(screen.queryByTestId("bad-slot-label-2")).toBeNull();
  });

  it("renders no label for slots with no power action", () => {
    render(
      <BoardDisplay
        {...defaultProps}
        powerTable={[undefined, undefined, undefined, undefined, undefined]}
      />,
    );
    expect(screen.queryByTestId(/^bad-slot-label-/)).toBeNull();
  });
});
