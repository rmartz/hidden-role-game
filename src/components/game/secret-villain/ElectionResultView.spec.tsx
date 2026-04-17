import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ElectionResultView } from "./ElectionResultView";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";

afterEach(cleanup);

const defaultVotes = [
  { playerName: "Alice", vote: "yes" as const },
  { playerName: "Bob", vote: "yes" as const },
  { playerName: "Charlie", vote: "no" as const },
];

const defaultProps = {
  presidentName: "Alice",
  chancellorNomineeName: "Bob",
  passed: true,
  votes: defaultVotes,
  onContinue: vi.fn(),
};

describe("ElectionResultView", () => {
  it("shows passed text when election passed", () => {
    render(<ElectionResultView {...defaultProps} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.election.resultPassed),
    ).toBeDefined();
  });

  it("shows failed text when election failed", () => {
    render(<ElectionResultView {...defaultProps} passed={false} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.election.resultFailed),
    ).toBeDefined();
  });

  it("renders vote list with all player names", () => {
    render(<ElectionResultView {...defaultProps} />);
    for (const vote of defaultVotes) {
      expect(screen.getByText(vote.playerName)).toBeDefined();
    }
  });

  it("displays correct vote counts", () => {
    render(<ElectionResultView {...defaultProps} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.election.yesCount(2)),
    ).toBeDefined();
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.election.noCount(1)),
    ).toBeDefined();
  });
});
