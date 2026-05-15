import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { JoinPromptView } from "./JoinPrompt";
import { JOIN_PROMPT_COPY } from "./JoinPrompt.copy";

afterEach(cleanup);

const noop = vi.fn();

const defaultProps = {
  playerName: "",
  onPlayerNameChange: noop,
  onSubmit: noop,
  isSubmitting: false,
  error: undefined,
  playerCount: undefined,
};

describe("Criterion 1: Mobile-portrait card with eyebrow, heading, and invited-count subtitle", () => {
  it("renders the eyebrow text 'You've been invited'", () => {
    render(<JoinPromptView {...defaultProps} />);
    expect(screen.getByText(JOIN_PROMPT_COPY.eyebrow)).toBeDefined();
  });

  it("renders the card heading", () => {
    render(<JoinPromptView {...defaultProps} />);
    expect(screen.getByText(JOIN_PROMPT_COPY.cardTitle)).toBeDefined();
  });

  it("does not render invited-count when playerCount is undefined", () => {
    render(<JoinPromptView {...defaultProps} playerCount={undefined} />);
    expect(screen.queryByText(JOIN_PROMPT_COPY.invitedCount(3))).toBeNull();
  });

  it("renders invited-count subtitle when playerCount is provided", () => {
    render(<JoinPromptView {...defaultProps} playerCount={3} />);
    expect(screen.getByText(JOIN_PROMPT_COPY.invitedCount(3))).toBeDefined();
  });

  it("uses full-width layout on mobile (no max-width restriction) and centered on desktop", () => {
    const { container } = render(<JoinPromptView {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    // Desktop: uses sm:max-w-[440px] sm:mx-auto; the outer wrapper has the class
    expect(card.className).toMatch(/sm:max-w-\[440px\]/);
  });
});

describe("Criterion 2: Name field and 'Join lobby →' primary button", () => {
  it("renders the name input field", () => {
    render(<JoinPromptView {...defaultProps} />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDefined();
  });

  it("renders the join button with 'Join lobby →' text", () => {
    render(<JoinPromptView {...defaultProps} />);
    expect(screen.getByText(JOIN_PROMPT_COPY.joinButton)).toBeDefined();
  });

  it("calls onPlayerNameChange when typing in the name field", () => {
    const onPlayerNameChange = vi.fn();
    render(
      <JoinPromptView
        {...defaultProps}
        onPlayerNameChange={onPlayerNameChange}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Alice" } });
    expect(onPlayerNameChange).toHaveBeenCalledWith("Alice");
  });

  it("calls onSubmit when form is submitted", () => {
    const onSubmit = vi.fn();
    render(
      <JoinPromptView
        {...defaultProps}
        playerName="Alice"
        onSubmit={onSubmit}
      />,
    );
    fireEvent.submit(screen.getByRole("form"));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("disables join button when playerName is empty", () => {
    render(<JoinPromptView {...defaultProps} playerName="" />);
    const button = screen
      .getByText(JOIN_PROMPT_COPY.joinButton)
      .closest("button");
    expect(button?.getAttribute("disabled")).not.toBeNull();
  });

  it("disables join button when isSubmitting is true", () => {
    render(
      <JoinPromptView
        {...defaultProps}
        playerName="Alice"
        isSubmitting={true}
      />,
    );
    const button = screen.getByText(JOIN_PROMPT_COPY.joining).closest("button");
    expect(button?.getAttribute("disabled")).not.toBeNull();
  });

  it("shows joining text on button while submitting", () => {
    render(
      <JoinPromptView
        {...defaultProps}
        playerName="Alice"
        isSubmitting={true}
      />,
    );
    expect(screen.getByText(JOIN_PROMPT_COPY.joining)).toBeDefined();
  });
});

describe("Criterion 3: Inline error slot", () => {
  it("does not render an error when error is undefined", () => {
    render(<JoinPromptView {...defaultProps} error={undefined} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders an error message when error is provided", () => {
    render(<JoinPromptView {...defaultProps} error="Name already taken" />);
    expect(screen.getByText("Name already taken")).toBeDefined();
  });
});

describe("Criterion 4: Redirect-rules note as subtle footer note", () => {
  it("renders the redirect-rules note as a footer paragraph", () => {
    render(<JoinPromptView {...defaultProps} />);
    expect(screen.getByText(JOIN_PROMPT_COPY.redirectNote)).toBeDefined();
  });

  it("does not render the redirect-rules note as a banner/alert role", () => {
    render(<JoinPromptView {...defaultProps} />);
    // It should be a subtle text element, not a prominent role=alert banner
    const note = screen.getByText(JOIN_PROMPT_COPY.redirectNote);
    expect(note.getAttribute("role")).not.toBe("alert");
  });
});
