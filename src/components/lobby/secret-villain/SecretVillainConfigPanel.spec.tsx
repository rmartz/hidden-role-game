import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SecretVillainConfigPanel } from "./SecretVillainConfigPanel";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game-modes/secret-villain/timer-config";
import { GameMode } from "@/lib/types";
import {
  SvBoardPreset,
  SpecialActionType,
} from "@/lib/game-modes/secret-villain/types";
import { SECRET_VILLAIN_CONFIG_PANEL_COPY } from "./SecretVillainConfigPanel.copy";
import { SECRET_VILLAIN_TIMER_CONFIG_PANEL_COPY } from "./SecretVillainTimerConfigPanel.copy";
import { TIMER_CONFIG_COPY } from "../TimerConfigPanel.copy";

afterEach(cleanup);

const defaultProps = {
  timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
  modeConfig: { gameMode: GameMode.SecretVillain as const },
  playerCount: 6,
  onTimerConfigChange: vi.fn(),
  onModeConfigFieldChange: vi.fn(),
};

describe("SecretVillainConfigPanel", () => {
  it("renders the board preset label", () => {
    render(<SecretVillainConfigPanel {...defaultProps} />);
    expect(
      screen.getByText(SECRET_VILLAIN_CONFIG_PANEL_COPY.boardPresetLabel),
    ).toBeDefined();
  });

  it("renders the board preset selector", () => {
    render(
      <SecretVillainConfigPanel
        {...defaultProps}
        modeConfig={{
          gameMode: GameMode.SecretVillain,
          boardPreset: SvBoardPreset.Medium,
        }}
      />,
    );
    expect(screen.getByRole("combobox")).toBeDefined();
  });

  it("renders the timer config heading", () => {
    render(<SecretVillainConfigPanel {...defaultProps} />);
    expect(screen.getByText(TIMER_CONFIG_COPY.heading)).toBeDefined();
  });

  it("renders the election vote timer row", () => {
    render(<SecretVillainConfigPanel {...defaultProps} />);
    expect(
      screen.getByText(SECRET_VILLAIN_TIMER_CONFIG_PANEL_COPY.electionVote),
    ).toBeDefined();
  });

  it("disables controls when disabled is true", () => {
    render(<SecretVillainConfigPanel {...defaultProps} disabled={true} />);
    const trigger = screen.getByRole("combobox");
    expect(trigger.getAttribute("disabled")).not.toBeNull();
  });

  it("disables controls when no change handlers are provided", () => {
    render(
      <SecretVillainConfigPanel
        timerConfig={DEFAULT_SECRET_VILLAIN_TIMER_CONFIG}
        modeConfig={defaultProps.modeConfig}
        playerCount={6}
      />,
    );
    const trigger = screen.getByRole("combobox");
    expect(trigger.getAttribute("disabled")).not.toBeNull();
  });

  it("shows custom power table editor when preset is Custom", () => {
    render(
      <SecretVillainConfigPanel
        {...defaultProps}
        modeConfig={{
          gameMode: GameMode.SecretVillain,
          boardPreset: SvBoardPreset.Custom,
          customPowerTable: [
            SpecialActionType.PolicyPeek,
            undefined,
            undefined,
          ],
        }}
      />,
    );
    expect(
      screen.getByText(SECRET_VILLAIN_CONFIG_PANEL_COPY.customBoardHeading),
    ).toBeDefined();
  });

  it("does not show custom power table editor for standard presets", () => {
    render(
      <SecretVillainConfigPanel
        {...defaultProps}
        modeConfig={{
          gameMode: GameMode.SecretVillain,
          boardPreset: SvBoardPreset.Medium,
        }}
      />,
    );
    expect(
      screen.queryByText(SECRET_VILLAIN_CONFIG_PANEL_COPY.customBoardHeading),
    ).toBeNull();
  });
});
