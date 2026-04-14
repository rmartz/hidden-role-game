import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import gameConfigReducer from "@/store/game-config-slice";
import { GameMode, RoleConfigMode, Team } from "@/lib/types";
import type { RoleDefinition } from "@/lib/types";
import { RoleConfig } from "./RoleConfig";
import { ROLE_CONFIG_COPY } from "./RoleConfig.copy";

afterEach(cleanup);

function makeStore() {
  return configureStore({ reducer: { gameConfig: gameConfigReducer } });
}

function renderWithStore(ui: React.ReactElement) {
  return render(<Provider store={makeStore()}>{ui}</Provider>);
}

const roleA: RoleDefinition<string, Team> = {
  id: "role-alpha",
  name: "Alpha",
  summary: "A helpful role",
  description: "Alpha does helpful things.",
  team: Team.Good,
};

const roleB: RoleDefinition<string, Team> = {
  id: "role-beta",
  name: "Beta",
  summary: "A tricky role",
  description: "Beta does tricky things.",
  team: Team.Bad,
};

const roleC: RoleDefinition<string, Team> = {
  id: "role-gamma",
  name: "Gamma",
  summary: "A powerful role",
  description: "Gamma does powerful things.",
  team: Team.Bad,
};

const roleDefinitions: Record<string, RoleDefinition<string, Team>> = {
  [roleA.id]: roleA,
  [roleB.id]: roleB,
  [roleC.id]: roleC,
};

const defaultProps = {
  roleDefinitions,
  playerCount: 5,
  gameMode: GameMode.Werewolf,
  roleConfigMode: RoleConfigMode.Custom,
  roleSlots: [
    { roleId: roleA.id, min: 1, max: 1 },
    { roleId: roleB.id, min: 0, max: 0 },
    { roleId: roleC.id, min: 1, max: 1 },
  ],
  readOnly: true as const,
};

function clickShowAll() {
  fireEvent.click(screen.getByText(ROLE_CONFIG_COPY.showAllRoles));
}

describe("RoleConfig search", () => {
  it("does not render the search input before Show all roles is clicked", () => {
    renderWithStore(<RoleConfig {...defaultProps} />);
    expect(
      screen.queryByPlaceholderText(ROLE_CONFIG_COPY.searchPlaceholder),
    ).toBeNull();
  });

  it("renders the search input after Show all roles is clicked", () => {
    renderWithStore(<RoleConfig {...defaultProps} />);
    clickShowAll();
    expect(
      screen.getByPlaceholderText(ROLE_CONFIG_COPY.searchPlaceholder),
    ).toBeDefined();
  });

  it("hides the search input when Show fewer roles is clicked", () => {
    renderWithStore(<RoleConfig {...defaultProps} />);
    clickShowAll();
    fireEvent.click(screen.getByText(ROLE_CONFIG_COPY.hideExtraRoles));
    expect(
      screen.queryByPlaceholderText(ROLE_CONFIG_COPY.searchPlaceholder),
    ).toBeNull();
  });

  it("shows all enabled roles when search is empty", () => {
    renderWithStore(<RoleConfig {...defaultProps} />);
    expect(screen.getByText(roleA.name)).toBeDefined();
    expect(screen.queryByText(roleB.name)).toBeNull();
    expect(screen.getByText(roleC.name)).toBeDefined();
  });

  it("filters the role list when a search query is entered", () => {
    renderWithStore(<RoleConfig {...defaultProps} />);
    clickShowAll();
    const input = screen.getByPlaceholderText(
      ROLE_CONFIG_COPY.searchPlaceholder,
    );
    fireEvent.change(input, { target: { value: "Alpha" } });
    expect(screen.getByText(roleA.name)).toBeDefined();
    expect(screen.queryByText(roleB.name)).toBeNull();
    expect(screen.queryByText(roleC.name)).toBeNull();
  });

  it("shows the no-results message when search matches nothing", () => {
    renderWithStore(<RoleConfig {...defaultProps} />);
    clickShowAll();
    const input = screen.getByPlaceholderText(
      ROLE_CONFIG_COPY.searchPlaceholder,
    );
    fireEvent.change(input, { target: { value: "zzznomatch" } });
    expect(screen.getByText(ROLE_CONFIG_COPY.noSearchResults)).toBeDefined();
  });

  it("includes disabled roles in search results", () => {
    renderWithStore(<RoleConfig {...defaultProps} />);
    clickShowAll();
    const input = screen.getByPlaceholderText(
      ROLE_CONFIG_COPY.searchPlaceholder,
    );
    fireEvent.change(input, { target: { value: "tricky" } });
    // roleB matches "tricky" in its summary even though it is disabled (max=0)
    expect(screen.getByText(roleB.name)).toBeDefined();
  });

  it("dims disabled roles during search", () => {
    renderWithStore(<RoleConfig {...defaultProps} />);
    clickShowAll();
    const input = screen.getByPlaceholderText(
      ROLE_CONFIG_COPY.searchPlaceholder,
    );
    fireEvent.change(input, { target: { value: "role" } });
    // All three roles match "role" in their IDs/descriptions; roleB is disabled
    const betaItem = screen.getByText(roleB.name).closest("li");
    expect(betaItem?.className).toContain("text-muted-foreground");
  });

  it("does not dim enabled roles during search", () => {
    renderWithStore(<RoleConfig {...defaultProps} />);
    clickShowAll();
    const input = screen.getByPlaceholderText(
      ROLE_CONFIG_COPY.searchPlaceholder,
    );
    fireEvent.change(input, { target: { value: "role" } });
    const alphaItem = screen.getByText(roleA.name).closest("li");
    expect(alphaItem?.className).not.toContain("text-muted-foreground");
  });

  it("clears the search query when Show fewer roles is clicked", () => {
    renderWithStore(<RoleConfig {...defaultProps} />);
    clickShowAll();
    const input = screen.getByPlaceholderText(
      ROLE_CONFIG_COPY.searchPlaceholder,
    );
    fireEvent.change(input, { target: { value: "Alpha" } });
    fireEvent.click(screen.getByText(ROLE_CONFIG_COPY.hideExtraRoles));
    // Collapsed view should show enabled roles again (not just the search match)
    expect(screen.getByText(roleC.name)).toBeDefined();
  });
});
