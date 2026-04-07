import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ActionGateView } from "./ActionGateView";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";

afterEach(cleanup);

describe("ActionGateView", () => {
  it("renders the heading", () => {
    render(<ActionGateView onReveal={vi.fn()} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.actionGate.heading),
    ).toBeDefined();
  });

  it("renders the description", () => {
    render(<ActionGateView onReveal={vi.fn()} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.actionGate.description),
    ).toBeDefined();
  });

  it("renders the Begin button", () => {
    render(<ActionGateView onReveal={vi.fn()} />);
    expect(
      screen.getByRole("button", {
        name: SECRET_VILLAIN_COPY.actionGate.begin,
      }),
    ).toBeDefined();
  });

  it("calls onReveal when Begin is clicked", () => {
    const onReveal = vi.fn();
    render(<ActionGateView onReveal={onReveal} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: SECRET_VILLAIN_COPY.actionGate.begin,
      }),
    );
    expect(onReveal).toHaveBeenCalledOnce();
  });
});
