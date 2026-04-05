import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SpecialActionType } from "@/lib/game-modes/secret-villain/types";
import type { SvCustomPowerConfig } from "@/lib/game-modes/secret-villain/types";
import { CustomPowerTableEditor } from "./CustomPowerTableEditor";
import { SECRET_VILLAIN_CONFIG_PANEL_COPY } from "./SecretVillainConfigPanel.copy";

afterEach(cleanup);

const defaultTable: SvCustomPowerConfig = [undefined, undefined, undefined];

describe("CustomPowerTableEditor", () => {
  it("renders the heading", () => {
    render(<CustomPowerTableEditor powerTable={defaultTable} />);
    expect(
      screen.getByText(SECRET_VILLAIN_CONFIG_PANEL_COPY.customBoardHeading),
    ).toBeDefined();
  });

  it("renders labels for all 5 bad card slots", () => {
    render(<CustomPowerTableEditor powerTable={defaultTable} />);
    for (let i = 1; i <= 5; i++) {
      expect(
        screen.getByText(SECRET_VILLAIN_CONFIG_PANEL_COPY.badCardSlotLabel(i)),
      ).toBeDefined();
    }
  });

  it("renders locked text for cards #4 and #5", () => {
    render(<CustomPowerTableEditor powerTable={defaultTable} />);
    const locked = screen.getAllByText(
      SECRET_VILLAIN_CONFIG_PANEL_COPY.badCardSlotLocked,
    );
    expect(locked).toHaveLength(2);
  });

  it("renders 3 select dropdowns for configurable slots", () => {
    render(
      <CustomPowerTableEditor powerTable={defaultTable} onChange={vi.fn()} />,
    );
    const triggers = screen.getAllByRole("combobox");
    expect(triggers).toHaveLength(3);
  });

  it("disables selects when disabled is true", () => {
    render(
      <CustomPowerTableEditor powerTable={defaultTable} disabled={true} />,
    );
    const triggers = screen.getAllByRole("combobox");
    for (const trigger of triggers) {
      expect(trigger.getAttribute("disabled")).not.toBeNull();
    }
  });

  it("disables selects when no onChange handler is provided", () => {
    render(<CustomPowerTableEditor powerTable={defaultTable} />);
    const triggers = screen.getAllByRole("combobox");
    for (const trigger of triggers) {
      expect(trigger.getAttribute("disabled")).not.toBeNull();
    }
  });

  it("sets configured power values on hidden inputs", () => {
    const configuredTable: SvCustomPowerConfig = [
      SpecialActionType.PolicyPeek,
      SpecialActionType.InvestigateTeam,
      SpecialActionType.SpecialElection,
    ];
    render(
      <CustomPowerTableEditor
        powerTable={configuredTable}
        onChange={vi.fn()}
      />,
    );
    const hiddenInputs = document.querySelectorAll<HTMLInputElement>(
      'input[aria-hidden="true"]',
    );
    const values = Array.from(hiddenInputs).map((input) => input.value);
    expect(values).toContain(SpecialActionType.PolicyPeek);
    expect(values).toContain(SpecialActionType.InvestigateTeam);
    expect(values).toContain(SpecialActionType.SpecialElection);
  });
});
