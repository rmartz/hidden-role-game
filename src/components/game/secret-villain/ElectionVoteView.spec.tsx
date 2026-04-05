import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ElectionVoteView } from "./ElectionVoteView";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";

afterEach(cleanup);

const defaultProps = {
  presidentName: "Alice",
  chancellorNomineeName: "Bob",
  onVote: vi.fn(),
  onResolve: vi.fn(),
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

  it("keeps vote buttons visible after voting with current vote highlighted", () => {
    render(<ElectionVoteView {...defaultProps} myVote="aye" />);
    expect(
      screen.getByRole("button", { name: SECRET_VILLAIN_COPY.election.aye }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: SECRET_VILLAIN_COPY.election.no }),
    ).toBeDefined();
  });

  it("shows waiting text after voting", () => {
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

  it("shows Reveal Results button when all players have voted", () => {
    render(<ElectionVoteView {...defaultProps} allVoted={true} myVote="aye" />);
    expect(
      screen.getByRole("button", {
        name: SECRET_VILLAIN_COPY.election.resolveVote,
      }),
    ).toBeDefined();
  });

  it("does not show Reveal Results button when not all players have voted", () => {
    render(
      <ElectionVoteView {...defaultProps} allVoted={false} myVote="aye" />,
    );
    expect(
      screen.queryByRole("button", {
        name: SECRET_VILLAIN_COPY.election.resolveVote,
      }),
    ).toBeNull();
  });

  it("does not show Reveal Results button without onResolve callback", () => {
    render(
      <ElectionVoteView
        {...defaultProps}
        onResolve={undefined}
        allVoted={true}
        myVote="aye"
      />,
    );
    expect(
      screen.queryByRole("button", {
        name: SECRET_VILLAIN_COPY.election.resolveVote,
      }),
    ).toBeNull();
  });

  it("shows pending player names when 3 or fewer are left to vote", () => {
    const players = [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
      { id: "p3", name: "Charlie" },
    ];
    render(
      <ElectionVoteView
        {...defaultProps}
        myVote="aye"
        players={players}
        votedPlayerIds={["p1"]}
      />,
    );
    expect(
      screen.getByText(
        SECRET_VILLAIN_COPY.election.waitingForPlayers(["Bob", "Charlie"]),
      ),
    ).toBeDefined();
  });

  it("shows generic waiting text when more than 3 are left to vote", () => {
    const players = [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
      { id: "p3", name: "Charlie" },
      { id: "p4", name: "Diana" },
      { id: "p5", name: "Eve" },
    ];
    render(
      <ElectionVoteView
        {...defaultProps}
        myVote="aye"
        players={players}
        votedPlayerIds={["p1"]}
      />,
    );
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.election.alreadyVoted),
    ).toBeDefined();
  });

  it("excludes eliminated players from pending voter count", () => {
    const players = [
      { id: "p1", name: "Alice" },
      { id: "p2", name: "Bob" },
      { id: "p3", name: "Charlie" },
    ];
    render(
      <ElectionVoteView
        {...defaultProps}
        myVote="aye"
        players={players}
        votedPlayerIds={["p1"]}
        eliminatedPlayerIds={["p3"]}
      />,
    );
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.election.waitingForPlayers(["Bob"])),
    ).toBeDefined();
  });
});
