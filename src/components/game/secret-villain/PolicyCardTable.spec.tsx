import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PolicyCardTable } from "./PolicyCardTable";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";

afterEach(cleanup);

const defaultProps = {
  cards: ["good", "bad", "bad"],
  onSelectDiscard: vi.fn(),
};

describe("PolicyCardTable", () => {
  it("renders one column button per card", () => {
    render(<PolicyCardTable {...defaultProps} />);
    expect(screen.getAllByTestId(/^policy-card-column-/)).toHaveLength(3);
  });

  it("renders one column per card", () => {
    render(<PolicyCardTable {...defaultProps} />);
    expect(screen.getAllByTestId(/^policy-card-\d$/)).toHaveLength(3);
  });

  it("shows pass and discard axis labels", () => {
    render(<PolicyCardTable {...defaultProps} />);
    expect(screen.getByText(SECRET_VILLAIN_COPY.policy.passAxis)).toBeDefined();
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.policy.discardAxis),
    ).toBeDefined();
  });

  it("marks the selected column as aria-pressed", () => {
    render(<PolicyCardTable {...defaultProps} discardIndex={1} />);
    const columns = screen.getAllByTestId(/^policy-card-column-/);
    expect(columns[0]?.getAttribute("aria-pressed")).toBe("false");
    expect(columns[1]?.getAttribute("aria-pressed")).toBe("true");
    expect(columns[2]?.getAttribute("aria-pressed")).toBe("false");
  });

  it("hides the pass-row card and shows it in the discard row when selected", () => {
    render(<PolicyCardTable {...defaultProps} discardIndex={1} />);
    // Pass row: selected card slot is invisible
    expect(screen.getByTestId("policy-card-1").className).toContain(
      "invisible",
    );
    // Pass row: unselected slots are visible
    expect(screen.getByTestId("policy-card-0").className).not.toContain(
      "invisible",
    );
    // Discard row: selected slot is visible (not invisible)
    expect(screen.getByTestId("policy-discard-cell-1").className).not.toContain(
      "invisible",
    );
    // Discard row: unselected slots are invisible
    expect(screen.getByTestId("policy-discard-cell-0").className).toContain(
      "invisible",
    );
  });

  it("calls onSelectDiscard with the column index when clicked", () => {
    const onSelectDiscard = vi.fn();
    render(
      <PolicyCardTable {...defaultProps} onSelectDiscard={onSelectDiscard} />,
    );
    screen.getByTestId("policy-card-column-2").click();
    expect(onSelectDiscard).toHaveBeenCalledWith(2);
  });

  it("disables all column buttons when disabled", () => {
    render(<PolicyCardTable {...defaultProps} disabled />);
    const columns = screen.getAllByTestId(/^policy-card-column-/);
    columns.forEach((col) => {
      expect(col.hasAttribute("disabled")).toBe(true);
    });
  });

  it("renders two columns for a two-card hand", () => {
    render(
      <PolicyCardTable cards={["good", "bad"]} onSelectDiscard={vi.fn()} />,
    );
    expect(screen.getAllByTestId(/^policy-card-column-/)).toHaveLength(2);
  });
});
