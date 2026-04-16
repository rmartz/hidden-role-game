import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import gameConfigReducer, { setRoleCount } from "@/store/game-config-slice";
import { GameMode, RoleConfigMode, Team } from "@/lib/types";
import type { RoleDefinition } from "@/lib/types";
import { RoleConfigEntry } from "./RoleConfigEntry";

afterEach(cleanup);

function makeStore(roleCounts: Record<string, number> = {}) {
  const store = configureStore({ reducer: { gameConfig: gameConfigReducer } });
  for (const [roleId, count] of Object.entries(roleCounts)) {
    store.dispatch(setRoleCount({ roleId, count }));
  }
  return store;
}

const uniqueRole: RoleDefinition<string, Team> = {
  id: "seer",
  name: "Seer",
  team: Team.Good,
  unique: true,
};

const nonUniqueRole: RoleDefinition<string, Team> = {
  id: "villager",
  name: "Villager",
  team: Team.Good,
};

const baseEditableProps = {
  gameMode: GameMode.Werewolf,
  roleConfigMode: RoleConfigMode.Custom,
  readOnly: false as const,
  disabled: false,
};

describe("RoleConfigEntry — unique role in Custom mode", () => {
  it("disables the increment button when a unique role is already at count 1", () => {
    const store = makeStore({ [uniqueRole.id]: 1 });
    render(
      <Provider store={store}>
        <ul>
          <RoleConfigEntry {...baseEditableProps} role={uniqueRole} />
        </ul>
      </Provider>,
    );
    const incrementButton = screen.getByRole("button", { name: "+" });
    expect(incrementButton.hasAttribute("disabled")).toBe(true);
  });

  it("enables the increment button when a unique role is at count 0", () => {
    const store = makeStore({ [uniqueRole.id]: 0 });
    render(
      <Provider store={store}>
        <ul>
          <RoleConfigEntry {...baseEditableProps} role={uniqueRole} />
        </ul>
      </Provider>,
    );
    const incrementButton = screen.getByRole("button", { name: "+" });
    expect(incrementButton.hasAttribute("disabled")).toBe(false);
  });

  it("does not disable the increment button for a non-unique role at count 1", () => {
    const store = makeStore({ [nonUniqueRole.id]: 1 });
    render(
      <Provider store={store}>
        <ul>
          <RoleConfigEntry {...baseEditableProps} role={nonUniqueRole} />
        </ul>
      </Provider>,
    );
    const incrementButton = screen.getByRole("button", { name: "+" });
    expect(incrementButton.hasAttribute("disabled")).toBe(false);
  });
});
