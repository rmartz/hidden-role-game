import { useState } from "react";
import { ROLE_DEFINITIONS } from "@/lib/roles";
import type { RoleSlot } from "@/server/models";

interface Props {
  playerCount: number;
  disabled: boolean;
  onStartGame: (roleSlots: RoleSlot[]) => void;
}

export default function RoleConfig({
  playerCount,
  disabled,
  onStartGame,
}: Props) {
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(ROLE_DEFINITIONS.map((r) => [r.id, 0])),
  );

  const total = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const isValid = total === playerCount;

  function handleChange(roleId: string, value: number) {
    setCounts((prev) => ({ ...prev, [roleId]: Math.max(0, value) }));
  }

  function handleStartGame() {
    const roleSlots: RoleSlot[] = ROLE_DEFINITIONS.filter(
      (r) => (counts[r.id] ?? 0) > 0,
    ).map((r) => ({ roleId: r.id, count: counts[r.id] ?? 0 }));
    onStartGame(roleSlots);
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Configure Roles</h2>
      <p>
        Assign {playerCount} role{playerCount !== 1 ? "s" : ""} ({total}/
        {playerCount} assigned)
      </p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {ROLE_DEFINITIONS.map((role) => (
          <li
            key={role.id}
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <span style={{ minWidth: "160px" }}>
              {role.name} ({role.team})
            </span>
            <button
              onClick={() => handleChange(role.id, (counts[role.id] ?? 0) - 1)}
              disabled={disabled || (counts[role.id] ?? 0) === 0}
            >
              -
            </button>
            <span>{counts[role.id] ?? 0}</span>
            <button
              onClick={() => handleChange(role.id, (counts[role.id] ?? 0) + 1)}
              disabled={disabled}
            >
              +
            </button>
          </li>
        ))}
      </ul>
      <button onClick={handleStartGame} disabled={disabled || !isValid}>
        Start Game
      </button>
    </div>
  );
}
