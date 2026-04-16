import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { TargetablePlayer } from "@/lib/game/modes/werewolf";
import { WerewolfAction, WerewolfRole } from "@/lib/game/modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
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
    fireEvent.click(firstTargetButton);

    expect(firstTargetButton.hasAttribute("disabled")).toBe(false);
    expect(mutateMock).toHaveBeenCalledWith({
      actionId: WerewolfAction.SetNightTarget,
      payload: {
        targetPlayerId: undefined,
      },
    });
  });

  it("handles intermediate Mentalist state after first-target deselect", () => {
    const targetPlayers: TargetablePlayer[] = [
      { id: "p2", name: "Bob" },
      { id: "p3", name: "Charlie" },
      { id: "p4", name: "Dave" },
    ];
    const { rerender } = render(
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

    fireEvent.click(screen.getByRole("button", { name: "Bob" }));

    expect(mutateMock).toHaveBeenCalledWith({
      actionId: WerewolfAction.SetNightTarget,
      payload: {
        targetPlayerId: undefined,
      },
    });

    mutateMock.mockClear();

    rerender(
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
          false,
        ])}
        isConfirmed={false}
        isGroupPhase={false}
        confirmPhaseKey={WerewolfRole.Mentalist}
        hasTarget={false}
        allAgreed={false}
        myNightTarget={undefined}
        mySecondNightTarget="p3"
        requiresSecondTarget={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Dave" }));

    expect(mutateMock).toHaveBeenCalledWith({
      actionId: WerewolfAction.SetNightTarget,
      payload: {
        targetPlayerId: "p4",
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

  it("sets no target when skip is clicked during Mentalist selection", () => {
    render(
      <PlayerTargetSelection
        gameId="game-1"
        players={[
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
          { id: "p3", name: "Charlie" },
        ]}
        targets={[
          [{ id: "p2", name: "Bob" }, true],
          [{ id: "p3", name: "Charlie" }, true],
        ]}
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

    fireEvent.click(
      screen.getByRole("button", {
        name: WEREWOLF_COPY.targetSelection.noTarget,
      }),
    );

    expect(mutateMock).toHaveBeenCalledWith({
      actionId: WerewolfAction.SetNightTarget,
      payload: {
        targetPlayerId: null,
      },
    });
  });

  it("sets first Mentalist target without second-target flag", () => {
    render(
      <PlayerTargetSelection
        gameId="game-1"
        players={[
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
          { id: "p3", name: "Charlie" },
        ]}
        targets={[
          [{ id: "p2", name: "Bob" }, false],
          [{ id: "p3", name: "Charlie" }, false],
        ]}
        isConfirmed={false}
        isGroupPhase={false}
        confirmPhaseKey={WerewolfRole.Mentalist}
        hasTarget={false}
        allAgreed={false}
        myNightTarget={undefined}
        requiresSecondTarget={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Bob" }));

    expect(mutateMock).toHaveBeenCalledWith({
      actionId: WerewolfAction.SetNightTarget,
      payload: {
        targetPlayerId: "p2",
      },
    });
  });

  it("sets second Mentalist target when first is already selected", () => {
    render(
      <PlayerTargetSelection
        gameId="game-1"
        players={[
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
          { id: "p3", name: "Charlie" },
        ]}
        targets={[
          [{ id: "p2", name: "Bob" }, true],
          [{ id: "p3", name: "Charlie" }, false],
        ]}
        isConfirmed={false}
        isGroupPhase={false}
        confirmPhaseKey={WerewolfRole.Mentalist}
        hasTarget={true}
        allAgreed={false}
        myNightTarget="p2"
        mySecondNightTarget={undefined}
        requiresSecondTarget={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Charlie" }));

    expect(mutateMock).toHaveBeenCalledWith({
      actionId: WerewolfAction.SetNightTarget,
      payload: {
        targetPlayerId: "p3",
        isSecondTarget: true,
      },
    });
  });

  it("shows choose-second-target heading after first Mentalist target is selected", () => {
    render(
      <PlayerTargetSelection
        gameId="game-1"
        players={[
          { id: "p1", name: "Alice" },
          { id: "p2", name: "Bob" },
          { id: "p3", name: "Charlie" },
        ]}
        targets={[
          [{ id: "p2", name: "Bob" }, true],
          [{ id: "p3", name: "Charlie" }, false],
        ]}
        isConfirmed={false}
        isGroupPhase={false}
        confirmPhaseKey={WerewolfRole.Mentalist}
        hasTarget={true}
        allAgreed={false}
        myNightTarget="p2"
        mySecondNightTarget={undefined}
        requiresSecondTarget={true}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: WEREWOLF_COPY.mentalist.chooseSecondTarget,
      }),
    ).toBeDefined();
  });
});
