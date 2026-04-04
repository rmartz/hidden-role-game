import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { GameRolesList } from "./GameRolesList";
import type { RoleInPlay } from "@/server/types";
import { Team } from "@/lib/types";

afterEach(cleanup);

const mockRoles: RoleInPlay[] = [
  { id: "seer", name: "Seer", team: Team.Good, min: 1, max: 1, count: 1 },
  {
    id: "werewolf",
    name: "Werewolf",
    team: Team.Bad,
    min: 1,
    max: 3,
    count: 2,
  },
  {
    id: "villager",
    name: "Villager",
    team: Team.Good,
    min: 2,
    max: 4,
  },
];

describe("GameRolesList", () => {
  it("renders role names when rolesInPlay is provided", () => {
    render(<GameRolesList roles={mockRoles} />);

    expect(screen.getByText("Roles In Play")).toBeDefined();
    expect(screen.getByText(/Seer/)).toBeDefined();
    expect(screen.getByText(/Werewolf/)).toBeDefined();
    expect(screen.getByText(/Villager/)).toBeDefined();
  });

  it("renders nothing when rolesInPlay is an empty array", () => {
    const { container } = render(<GameRolesList roles={[]} />);

    expect(container.innerHTML).toBe("");
  });
});
