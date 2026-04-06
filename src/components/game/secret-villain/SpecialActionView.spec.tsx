import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SpecialActionView } from "./SpecialActionView";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import { SpecialActionType } from "@/lib/game/modes/secret-villain/types";

afterEach(cleanup);

const players = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
];

const defaultProps = {
  actionType: SpecialActionType.InvestigateTeam,
  isPresident: true,
  presidentName: "Alice",
  players,
  onSelectPlayer: vi.fn(),
  onConfirm: vi.fn(),
};

describe("SpecialActionView", () => {
  it("shows investigate heading for investigate-team action", () => {
    render(<SpecialActionView {...defaultProps} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.specialAction.investigateHeading),
    ).toBeDefined();
  });

  it("shows special election heading for special-election action", () => {
    render(
      <SpecialActionView
        {...defaultProps}
        actionType={SpecialActionType.SpecialElection}
      />,
    );
    expect(
      screen.getByText(
        SECRET_VILLAIN_COPY.specialAction.specialElectionHeading,
      ),
    ).toBeDefined();
  });

  it("shows shoot heading for shoot action", () => {
    render(
      <SpecialActionView
        {...defaultProps}
        actionType={SpecialActionType.Shoot}
      />,
    );
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.specialAction.shootHeading),
    ).toBeDefined();
  });

  it("shows consent button for investigation target", () => {
    const onConsent = vi.fn();
    render(
      <SpecialActionView
        {...defaultProps}
        isPresident={false}
        investigationConsent={true}
        onConsent={onConsent}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: SECRET_VILLAIN_COPY.specialAction.investigateReveal,
      }),
    ).toBeDefined();
  });

  it("shows peeked cards for policy-peek action", () => {
    render(
      <SpecialActionView
        {...defaultProps}
        actionType={SpecialActionType.PolicyPeek}
        peekedCards={["good", "bad", "bad"]}
      />,
    );
    const goodCards = screen.getAllByText(SECRET_VILLAIN_COPY.policy.goodCard);
    const badCards = screen.getAllByText(SECRET_VILLAIN_COPY.policy.badCard);
    expect(goodCards.length + badCards.length).toBe(3);
  });

  it("shows waiting message for non-president", () => {
    render(<SpecialActionView {...defaultProps} isPresident={false} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.policy.waitingForPresident("Alice")),
    ).toBeDefined();
  });

  it("shows investigation result when available", () => {
    render(
      <SpecialActionView
        {...defaultProps}
        investigationResult={{ targetPlayerId: "p2", team: "Bad" }}
      />,
    );
    expect(
      screen.getByText(
        SECRET_VILLAIN_COPY.specialAction.investigateResult("Bob", "Bad"),
      ),
    ).toBeDefined();
  });

  it("shows Done button when investigationResult is present and onResolve is provided", () => {
    render(
      <SpecialActionView
        {...defaultProps}
        investigationResult={{ targetPlayerId: "p2", team: "bad" }}
        onResolve={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: SECRET_VILLAIN_COPY.specialAction.done,
      }),
    ).toBeDefined();
  });

  it("shows waiting message with player name when investigationWaitingForPlayerId is set", () => {
    render(
      <SpecialActionView
        {...defaultProps}
        investigationWaitingForPlayerId="p2"
      />,
    );
    expect(
      screen.getByText(
        SECRET_VILLAIN_COPY.specialAction.investigateWaitingConsent("Bob"),
      ),
    ).toBeDefined();
  });

  it("shows PolicyPeekView with Done button when peekedCards is present", () => {
    render(
      <SpecialActionView
        {...defaultProps}
        actionType={SpecialActionType.PolicyPeek}
        peekedCards={["good", "bad", "bad"]}
        onResolve={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: SECRET_VILLAIN_COPY.specialAction.policyPeekConfirm,
      }),
    ).toBeDefined();
  });

  it("shows Peek button before cards are revealed for policy-peek", () => {
    const onPeek = vi.fn();
    render(
      <SpecialActionView
        {...defaultProps}
        actionType={SpecialActionType.PolicyPeek}
        onPeek={onPeek}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: SECRET_VILLAIN_COPY.specialAction.policyPeekReveal,
      }),
    ).toBeDefined();
    expect(
      screen.getByText(
        SECRET_VILLAIN_COPY.specialAction.policyPeekInstructions,
      ),
    ).toBeDefined();
  });

  it("does not show player selection list for policy-peek", () => {
    render(
      <SpecialActionView
        {...defaultProps}
        actionType={SpecialActionType.PolicyPeek}
        onPeek={vi.fn()}
      />,
    );
    expect(screen.queryByText("Alice")).toBeNull();
    expect(screen.queryByText("Bob")).toBeNull();
  });

  it("uses presidentName in waiting message for non-president players", () => {
    render(
      <SpecialActionView
        {...defaultProps}
        isPresident={false}
        presidentName="Charlie"
      />,
    );
    expect(
      screen.getByText(
        SECRET_VILLAIN_COPY.policy.waitingForPresident("Charlie"),
      ),
    ).toBeDefined();
  });
});
