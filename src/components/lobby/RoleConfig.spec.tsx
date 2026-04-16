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

// roleA and roleC are enabled (playerCount: 1); roleB is absent (count defaults to 0 = disabled)
const defaultProps = {
  roleDefinitions,
  playerCount: 5,
  gameMode: GameMode.Werewolf,
  roleConfigMode: RoleConfigMode.Custom,
  roleBuckets: [
    { roleId: roleA.id, playerCount: 1 },
    { roleId: roleC.id, playerCount: 1 },
  ],
  readOnly: true as const,
};

function clickShowAll() {
  fireEvent.click(screen.getByText(ROLE_CONFIG_COPY.showAllRoles));
}

describe("RoleConfig collapsed view", () => {
  it("shows only enabled roles (flat list) regardless of category grouping", () => {
    const categorizedProps = {
      ...defaultProps,
      categoryOrder: ["cat-a", "cat-b"],
      categoryLabels: { "cat-a": "Category A", "cat-b": "Category B" },
      roleDefinitions: {
        [roleA.id]: { ...roleA, category: "cat-a" },
        [roleB.id]: { ...roleB, category: "cat-b" },
        [roleC.id]: { ...roleC, category: "cat-a" },
      },
    };
    renderWithStore(<RoleConfig {...categorizedProps} />);
    // Enabled roles (A and C) are visible; disabled role (B) is hidden
    expect(screen.getByText(roleA.name)).toBeDefined();
    expect(screen.queryByText(roleB.name)).toBeNull();
    expect(screen.getByText(roleC.name)).toBeDefined();
    // No category headings are rendered in the collapsed view
    expect(screen.queryByText("Category A")).toBeNull();
    expect(screen.queryByText("Category B")).toBeNull();
  });
});

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

  it("hides non-matching disabled roles when a search query is entered", () => {
    renderWithStore(<RoleConfig {...defaultProps} />);
    clickShowAll();
    const input = screen.getByPlaceholderText(
      ROLE_CONFIG_COPY.searchPlaceholder,
    );
    fireEvent.change(input, { target: { value: "Alpha" } });
    // Enabled roles are always visible regardless of search
    expect(screen.getByText(roleA.name)).toBeDefined();
    expect(screen.getByText(roleC.name)).toBeDefined();
    // roleB is disabled and does not match "Alpha" → not shown
    expect(screen.queryByText(roleB.name)).toBeNull();
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
    // roleB matches "tricky" in its summary even though it is disabled (count=0)
    expect(screen.getByText(roleB.name)).toBeDefined();
  });

  it("dims disabled roles during search", () => {
    renderWithStore(<RoleConfig {...defaultProps} />);
    clickShowAll();
    const input = screen.getByPlaceholderText(
      ROLE_CONFIG_COPY.searchPlaceholder,
    );
    fireEvent.change(input, { target: { value: "tricky" } });
    // roleB is disabled and matches "tricky" → appears in search results, dimmed
    const betaItem = screen.getByText(roleB.name).closest("li");
    expect(betaItem?.getAttribute("data-dimmed")).toBe("true");
  });

  it("does not dim enabled roles during search", () => {
    renderWithStore(<RoleConfig {...defaultProps} />);
    clickShowAll();
    const input = screen.getByPlaceholderText(
      ROLE_CONFIG_COPY.searchPlaceholder,
    );
    fireEvent.change(input, { target: { value: "tricky" } });
    // roleA is enabled and always shown at the top — never dimmed
    const alphaItem = screen.getByText(roleA.name).closest("li");
    expect(alphaItem?.getAttribute("data-dimmed")).toBe("false");
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

describe("RoleConfig expanded view", () => {
  it("shows disabled roles as a flat list when expanded with no search (uncategorized)", () => {
    // defaultProps has no categoryOrder; roleB is disabled
    renderWithStore(<RoleConfig {...defaultProps} />);
    // roleB is hidden in the collapsed view
    expect(screen.queryByText(roleB.name)).toBeNull();
    clickShowAll();
    // roleB is visible in the expanded + no-search + uncategorized state
    expect(screen.getByText(roleB.name)).toBeDefined();
  });

  it("shows a flat list of matches during active search, bypassing category headings", () => {
    const categorizedProps = {
      ...defaultProps,
      categoryOrder: ["cat-a", "cat-b"],
      categoryLabels: { "cat-a": "Category A", "cat-b": "Category B" },
      roleDefinitions: {
        // roleA and roleC are enabled (in roleBuckets), roleB is disabled
        [roleA.id]: { ...roleA, category: "cat-a" },
        [roleB.id]: { ...roleB, category: "cat-b" }, // matches "tricky"
        [roleC.id]: { ...roleC, category: "cat-a" },
      },
    };
    renderWithStore(<RoleConfig {...categorizedProps} />);
    clickShowAll();
    const input = screen.getByPlaceholderText(
      ROLE_CONFIG_COPY.searchPlaceholder,
    );
    fireEvent.change(input, { target: { value: "tricky" } });
    // Only roleB matches — shown in flat list without category headings
    expect(screen.getByText(roleB.name)).toBeDefined();
    expect(screen.queryByText("Category B")).toBeNull();
    expect(screen.queryByText("Category A")).toBeNull();
  });
});
