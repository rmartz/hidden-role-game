import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { TargetablePlayer } from "@/lib/game/modes/werewolf";
import { WerewolfAction, WerewolfRole } from "@/lib/game/modes/werewolf";
import { PlayerTargetSelection } from "./PlayerTargetSelection";

type TargetSelectionTuple = readonly [TargetablePlayer, boolean];

const { mutateMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
}));

vi.mock("@/hooks", () => ({
  useGameAction: () => ({
    mutate: mutateMock,
    isPending: false,
  }),
}));

vi.mock("./ConfirmTargetButton", () => ({
  ConfirmTargetButton: () => <button type="button">confirm</button>,
}));

vi.mock("./WitchInformationPanel", () => ({
  WitchInformationPanel: () => <div>witch-info</div>,
}));

vi.mock("./GroupTargetSuggestion", () => ({
  GroupTargetSuggestion: () => <div>group-target-suggestion</div>,
}));

afterEach(() => {
  cleanup();
  mutateMock.mockReset();
});

describe("PlayerTargetSelection", () => {
  it("allows deselecting the first-selected Mentalist target", () => {
    const targetPlayers: TargetablePlayer[] = [
      { id: "p2", name: "Bob" },
      { id: "p3", name: "Charlie" },
      { id: "p4", name: "Dave" },
    ];

    render(
      <PlayerTargetSelection
        gameId="game-1"
        players={[
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
          { id: "p3", name: "Charlie" },
          { id: "p4", name: "Dave" },
        ]}
        targets={targetPlayers.map<TargetSelectionTuple>((player) => [
          player,
          player.id === "p2",
        ])}
        isConfirmed={false}
        isGroupPhase={false}
        confirmPhaseKey={WerewolfRole.Mentalist}
        hasTarget={true}
        allAgreed={false}
        myNightTarget="p2"
        mySecondNightTarget="p3"
        requiresSecondTarget={true}
      />,
    );

    const firstTargetButton = screen.getByRole("button", { name: "Bob" });
    fireEvent.click(screen.getByRole("button", { name: "Bob" }));

    expect(firstTargetButton.hasAttribute("disabled")).toBe(false);
    expect(mutateMock).toHaveBeenCalledWith({
      actionId: WerewolfAction.SetNightTarget,
      payload: {
        targetPlayerId: undefined,
      },
    });
  });

  it("allows deselecting the second-selected Mentalist target", () => {
    const targetPlayers: TargetablePlayer[] = [
      { id: "p2", name: "Bob" },
      { id: "p3", name: "Charlie" },
      { id: "p4", name: "Dave" },
    ];

    render(
      <PlayerTargetSelection
        gameId="game-1"
        players={[
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
          { id: "p3", name: "Charlie" },
          { id: "p4", name: "Dave" },
        ]}
        targets={targetPlayers.map<TargetSelectionTuple>((player) => [
          player,
          player.id === "p2",
        ])}
        isConfirmed={false}
        isGroupPhase={false}
        confirmPhaseKey={WerewolfRole.Mentalist}
        hasTarget={true}
        allAgreed={false}
        myNightTarget="p2"
        mySecondNightTarget="p3"
        requiresSecondTarget={true}
      />,
    );

    const secondTargetButton = screen.getByRole("button", { name: "Charlie" });

    fireEvent.click(secondTargetButton);

    expect(secondTargetButton.hasAttribute("disabled")).toBe(false);
    expect(mutateMock).toHaveBeenCalledWith({
      actionId: WerewolfAction.SetNightTarget,
      payload: {
        targetPlayerId: undefined,
        isSecondTarget: true,
      },
    });
  });
});
