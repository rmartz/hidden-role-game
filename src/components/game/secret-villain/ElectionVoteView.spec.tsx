import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ElectionVoteView } from "./ElectionVoteView";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";

afterEach(cleanup);

const defaultProps = {
  presidentName: "Alice",
  chancellorNomineeName: "Bob",
  onVote: vi.fn(),
};

describe("ElectionVoteView", () => {
  it("shows vote buttons when no vote has been cast", () => {
    render(<ElectionVoteView {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: SECRET_VILLAIN_COPY.election.aye }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: SECRET_VILLAIN_COPY.election.no }),
    ).toBeDefined();
  });

  it("shows already-voted text when voted aye", () => {
    render(<ElectionVoteView {...defaultProps} myVote="aye" />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.election.alreadyVoted),
    ).toBeDefined();
  });

  it("shows already-voted text when voted no", () => {
    render(<ElectionVoteView {...defaultProps} myVote="no" />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.election.alreadyVoted),
    ).toBeDefined();
  });

  it("hides vote buttons when eliminated", () => {
    render(<ElectionVoteView {...defaultProps} isEliminated={true} />);
    expect(
      screen.queryByRole("button", { name: SECRET_VILLAIN_COPY.election.aye }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: SECRET_VILLAIN_COPY.election.no }),
    ).toBeNull();
  });

  it("shows eliminated text when eliminated", () => {
    render(<ElectionVoteView {...defaultProps} isEliminated={true} />);
    expect(screen.getByText(SECRET_VILLAIN_COPY.eliminated)).toBeDefined();
  });
});
