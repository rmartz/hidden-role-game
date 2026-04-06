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

  it("renders card labels in the pass row", () => {
    render(<PolicyCardTable {...defaultProps} />);
    // 1 good + 2 bad
    expect(
      screen.getAllByText(SECRET_VILLAIN_COPY.policy.goodCard),
    ).toHaveLength(1);
    expect(
      screen.getAllByText(SECRET_VILLAIN_COPY.policy.badCard),
    ).toHaveLength(2);
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
    columns.forEach((col) => { expect(col.hasAttribute("disabled")).toBe(true); });
  });

  it("renders two columns for a two-card hand", () => {
    render(
      <PolicyCardTable cards={["good", "bad"]} onSelectDiscard={vi.fn()} />,
    );
    expect(screen.getAllByTestId(/^policy-card-column-/)).toHaveLength(2);
  });
});
