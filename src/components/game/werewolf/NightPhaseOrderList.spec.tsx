import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NightPhaseOrderList } from "./NightPhaseOrderList";

afterEach(cleanup);

const roles: Record<string, { name: string }> = {
  "werewolf-seer": { name: "Seer" },
  "werewolf-werewolf": { name: "Werewolf" },
  "werewolf-bodyguard": { name: "Bodyguard" },
  "werewolf-witch": { name: "Witch" },
};

const nightPhaseOrder = [
  "werewolf-seer",
  "werewolf-werewolf",
  "werewolf-bodyguard",
  "werewolf-witch",
];

describe("NightPhaseOrderList", () => {
  it("renders null when nightPhaseOrder is empty", () => {
    const { container } = render(
      <NightPhaseOrderList
        nightPhaseOrder={[]}
        currentPhaseIndex={0}
        roles={roles}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders all phase labels", () => {
    render(
      <NightPhaseOrderList
        nightPhaseOrder={nightPhaseOrder}
        currentPhaseIndex={-1}
        roles={roles}
      />,
    );

    expect(screen.getByText("Seer")).toBeDefined();
    expect(screen.getByText("Werewolf")).toBeDefined();
    expect(screen.getByText("Bodyguard")).toBeDefined();
    expect(screen.getByText("Witch")).toBeDefined();
  });

  it("marks the current phase with a (current) indicator", () => {
    render(
      <NightPhaseOrderList
        nightPhaseOrder={nightPhaseOrder}
        currentPhaseIndex={1}
        roles={roles}
      />,
    );

    expect(screen.getByText("(current)")).toBeDefined();
  });

  it("does not show a (current) indicator when no phase is current", () => {
    render(
      <NightPhaseOrderList
        nightPhaseOrder={nightPhaseOrder}
        currentPhaseIndex={-1}
        roles={roles}
      />,
    );

    expect(screen.queryByText("(current)")).toBeNull();
  });

  it("applies line-through class to past phases", () => {
    const { container } = render(
      <NightPhaseOrderList
        nightPhaseOrder={nightPhaseOrder}
        currentPhaseIndex={2}
        roles={roles}
      />,
    );

    const items = container.querySelectorAll("[class*='line-through']");
    expect(items.length).toBe(2);
  });

  it("does not apply line-through class to future phases", () => {
    const { container } = render(
      <NightPhaseOrderList
        nightPhaseOrder={nightPhaseOrder}
        currentPhaseIndex={0}
        roles={roles}
      />,
    );

    const items = container.querySelectorAll("[class*='line-through']");
    expect(items.length).toBe(0);
  });

  it("renders phase numbers in sequence", () => {
    render(
      <NightPhaseOrderList
        nightPhaseOrder={nightPhaseOrder}
        currentPhaseIndex={-1}
        roles={roles}
      />,
    );

    expect(screen.getByText("1.")).toBeDefined();
    expect(screen.getByText("2.")).toBeDefined();
    expect(screen.getByText("3.")).toBeDefined();
    expect(screen.getByText("4.")).toBeDefined();
  });
});
