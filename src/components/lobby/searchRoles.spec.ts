import { describe, it, expect } from "vitest";
import { searchRoles } from "./searchRoles";
import type { RoleDefinition } from "@/lib/types";
import { Team } from "@/lib/types";

function makeRole(
  overrides: Partial<RoleDefinition<string, Team>>,
): RoleDefinition<string, Team> {
  return {
    id: "test-role",
    name: "Test Role",
    team: Team.Good,
    ...overrides,
  };
}

describe("searchRoles", () => {
  it("returns all roles when query is empty", () => {
    const roles = [makeRole({ name: "Seer" }), makeRole({ name: "Doctor" })];
    expect(searchRoles(roles, "")).toEqual(roles);
  });

  it("returns all roles when query is only whitespace", () => {
    const roles = [makeRole({ name: "Seer" }), makeRole({ name: "Doctor" })];
    expect(searchRoles(roles, "   ")).toEqual(roles);
  });

  it("matches by role name (case-insensitive)", () => {
    const seer = makeRole({ name: "Seer" });
    const doctor = makeRole({ name: "Doctor" });
    const result = searchRoles([seer, doctor], "seer");
    expect(result).toEqual([seer]);
  });

  it("matches by partial role name", () => {
    const werewolf = makeRole({ name: "Werewolf" });
    const wolfCub = makeRole({ name: "Wolf Cub" });
    const seer = makeRole({ name: "Seer" });
    const result = searchRoles([werewolf, wolfCub, seer], "wolf");
    expect(result).toEqual([werewolf, wolfCub]);
  });

  it("matches by summary", () => {
    const role = makeRole({
      name: "Seer",
      summary: "Discovers if a player is evil each night",
    });
    const other = makeRole({ name: "Doctor", summary: "Heals a player" });
    const result = searchRoles([role, other], "evil");
    expect(result).toEqual([role]);
  });

  it("matches by description", () => {
    const role = makeRole({
      name: "Witch",
      description: "Has a one-time potion ability",
    });
    const other = makeRole({
      name: "Seer",
      description: "Investigates wolves",
    });
    const result = searchRoles([role, other], "potion");
    expect(result).toEqual([role]);
  });

  it("matches by category value", () => {
    const role = makeRole({ name: "Seer", category: "villager-investigation" });
    const other = makeRole({ name: "Werewolf", category: "evil-killing" });
    const result = searchRoles([role, other], "villager-investigation");
    expect(result).toEqual([role]);
  });

  it("matches by category label when categoryLabels are provided", () => {
    const seer = makeRole({ name: "Seer", category: "villager-investigation" });
    const werewolf = makeRole({ name: "Werewolf", category: "evil-killing" });
    const categoryLabels = {
      "villager-investigation": "Villager — Investigation",
      "evil-killing": "Evil — Killing",
    };
    const result = searchRoles([seer, werewolf], "investigation", {
      categoryLabels,
    });
    expect(result).toEqual([seer]);
  });

  it("matches multi-word category label queries", () => {
    const werewolf = makeRole({ name: "Werewolf", category: "evil-killing" });
    const seer = makeRole({ name: "Seer", category: "villager-investigation" });
    const categoryLabels = {
      "evil-killing": "Evil — Killing",
      "villager-investigation": "Villager — Investigation",
    };
    const result = searchRoles([werewolf, seer], "evil killing", {
      categoryLabels,
    });
    expect(result).toEqual([werewolf]);
  });

  it("matches by alias", () => {
    const doctor = makeRole({ name: "Doctor", aliases: ["healer", "medic"] });
    const seer = makeRole({ name: "Seer", aliases: ["oracle"] });
    const result = searchRoles([doctor, seer], "healer");
    expect(result).toEqual([doctor]);
  });

  it("returns empty array when no roles match", () => {
    const roles = [makeRole({ name: "Seer" }), makeRole({ name: "Doctor" })];
    expect(searchRoles(roles, "zzznomatch")).toEqual([]);
  });

  it("handles roles without optional fields", () => {
    const minimal = makeRole({ name: "Villager" });
    const result = searchRoles([minimal], "villager");
    expect(result).toEqual([minimal]);
  });
});

describe("searchRoles — Werewolf role aliases", () => {
  // Import is resolved at module load time via Vitest's path alias support
  it("finds Doctor by 'healer' alias", async () => {
    const { WEREWOLF_ROLES } = await import("@/lib/game/modes/werewolf/roles");
    const roles = Object.values(WEREWOLF_ROLES) as RoleDefinition<
      string,
      Team
    >[];
    const result = searchRoles(roles, "healer");
    expect(result.some((r) => r.name === "Doctor")).toBe(true);
  });

  it("finds Seer by 'oracle' alias", async () => {
    const { WEREWOLF_ROLES } = await import("@/lib/game/modes/werewolf/roles");
    const roles = Object.values(WEREWOLF_ROLES) as RoleDefinition<
      string,
      Team
    >[];
    const result = searchRoles(roles, "oracle");
    expect(result.some((r) => r.name === "Seer")).toBe(true);
  });

  it("finds Werewolf by 'wolf' alias", async () => {
    const { WEREWOLF_ROLES } = await import("@/lib/game/modes/werewolf/roles");
    const roles = Object.values(WEREWOLF_ROLES) as RoleDefinition<
      string,
      Team
    >[];
    const result = searchRoles(roles, "wolf");
    expect(result.some((r) => r.name === "Werewolf")).toBe(true);
  });
});
