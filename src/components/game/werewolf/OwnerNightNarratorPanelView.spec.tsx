import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

import {
  OwnerNightNarratorPanelView,
  type OwnerNightNarratorPanelViewProps,
} from "./OwnerNightNarratorPanelView";

afterEach(cleanup);

const baseProps: OwnerNightNarratorPanelViewProps = {
  gameId: "game-1",
  activePhaseKey: "seer",
  activePhaseLabel: "Seer",
  activePlayerNames: [],
  isFirstTurn: false,
  isWitchAbilitySkipped: false,
  activeTargetConfirmed: false,
  abilityBypass: false,
  onRestoreWitchAbility: vi.fn(),
  onBypassWitchAbility: vi.fn(),
  isVeteranPhase: false,
  veteranAlertsUsed: 0,
  isVeteranAlerted: false,
  veteranHasDecided: false,
  isActionConfirmed: false,
  onVeteranAlert: vi.fn(),
  onVeteranSkip: vi.fn(),
  onVeteranConfirm: vi.fn(),
  isEvilEmpathPhase: false,
  hasGroupAction: false,
  groupMemberCount: 1,
  resolvedVotes: [],
  targetablePlayers: [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
  ],
  onTargetClick: vi.fn(),
  requiresDualTarget: false,
  isResultRevealed: false,
  isIlluminatiPhase: false,
  illuminatiPlayers: [],
  illuminatiRoleAssignments: [],
  isIlluminatiRevealed: false,
  isPending: false,
};

describe("OwnerNightNarratorPanelView", () => {
  it("renders the currently-awake label and active phase label", () => {
    render(
      <OwnerNightNarratorPanelView
        {...baseProps}
        activePhaseLabel="Seer"
        activePlayerNames={["Alice"]}
      />,
    );

    expect(
      screen.getByText(WEREWOLF_COPY.narrator.currentlyAwake, { exact: false }),
    ).toBeDefined();
    expect(screen.getByText("Seer")).toBeDefined();
    expect(screen.getByText("(Alice)")).toBeDefined();
  });

  it("renders the target panel with targetable players on a non-first turn", () => {
    render(<OwnerNightNarratorPanelView {...baseProps} />);

    expect(screen.getByRole("button", { name: "Alice" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Bob" })).toBeDefined();
  });

  it("renders the veteran panel and fires onVeteranAlert when alerting", () => {
    const onVeteranAlert = vi.fn();
    render(
      <OwnerNightNarratorPanelView
        {...baseProps}
        isVeteranPhase
        veteranAlertsUsed={0}
        onVeteranAlert={onVeteranAlert}
      />,
    );

    const alertButton = screen.getByRole("button", {
      name: WEREWOLF_COPY.veteran.alertButton,
    });
    fireEvent.click(alertButton);
    expect(onVeteranAlert).toHaveBeenCalledTimes(1);
  });

  it("renders the witch-ability-skipped controls and fires restore/bypass callbacks", () => {
    const onRestoreWitchAbility = vi.fn();
    const onBypassWitchAbility = vi.fn();
    render(
      <OwnerNightNarratorPanelView
        {...baseProps}
        activePhaseKey="witch"
        isWitchAbilitySkipped
        onRestoreWitchAbility={onRestoreWitchAbility}
        onBypassWitchAbility={onBypassWitchAbility}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: WEREWOLF_COPY.narrator.restoreAbility,
      }),
    );
    expect(onRestoreWitchAbility).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("button", {
        name: WEREWOLF_COPY.narrator.bypassAbility,
      }),
    );
    expect(onBypassWitchAbility).toHaveBeenCalledTimes(1);
  });

  it("renders the evil empath adjacency result when provided", () => {
    render(
      <OwnerNightNarratorPanelView
        {...baseProps}
        isEvilEmpathPhase
        evilEmpathNightResult
      />,
    );

    expect(
      screen.getByText(WEREWOLF_COPY.evilEmpath.adjacentResult),
    ).toBeDefined();
  });

  it("does not render the target panel on the first turn", () => {
    render(
      <OwnerNightNarratorPanelView
        {...baseProps}
        isFirstTurn
        narratorInstruction={{
          wakeInstruction: "Tell Seer to open their eyes.",
        }}
      />,
    );

    expect(screen.queryByRole("button", { name: "Alice" })).toBeNull();
    expect(screen.getByText("“Tell Seer to open their eyes.”")).toBeDefined();
  });
});
