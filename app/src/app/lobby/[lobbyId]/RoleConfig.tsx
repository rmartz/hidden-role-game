import { useEffect, useState } from "react";
import type { RoleDefinition } from "@/lib/models";
import type { RoleSlot } from "@/server/models";

interface ReadOnlyProps {
  roleDefinitions: RoleDefinition[];
  roleSlots?: RoleSlot[];
  playerCount: number;
  readOnly: true;
}

interface EditableProps {
  roleDefinitions: RoleDefinition[];
  playerCount: number;
  readOnly: false;
  disabled: boolean;
  onRoleSlotsChange: (roleSlots: RoleSlot[]) => void;
}

type Props = ReadOnlyProps | EditableProps;

export default function RoleConfig(props: Props) {
  const { roleDefinitions, playerCount, readOnly } = props;

  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(roleDefinitions.map((r) => [r.id, 0])),
  );

  const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

  useEffect(() => {
    if (readOnly) return;
    const timer = setTimeout(() => {
      const roleSlots: RoleSlot[] = roleDefinitions
        .filter((r) => (counts[r.id] ?? 0) > 0)
        .map((r) => ({ roleId: r.id, count: counts[r.id] ?? 0 }));
      props.onRoleSlotsChange(roleSlots);
    }, 500);
    return () => clearTimeout(timer);
  }, [counts]);

  function handleChange(roleId: string, value: number) {
    setCounts((prev) => ({ ...prev, [roleId]: Math.max(0, value) }));
  }

  const displayCounts = readOnly
    ? Object.fromEntries(
        (props.roleSlots ?? []).map((s) => [s.roleId, s.count]),
      )
    : counts;

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Configure Roles</h2>
      {!readOnly && (
        <p>
          Assign {playerCount} role{playerCount !== 1 ? "s" : ""} ({total}/
          {playerCount} assigned)
        </p>
      )}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {roleDefinitions.map((role) => (
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
            {readOnly ? (
              <span>{displayCounts[role.id] ?? 0}</span>
            ) : (
              <>
                <button
                  onClick={() =>
                    handleChange(role.id, (counts[role.id] ?? 0) - 1)
                  }
                  disabled={props.disabled || (counts[role.id] ?? 0) === 0}
                >
                  -
                </button>
                <span>{counts[role.id] ?? 0}</span>
                <button
                  onClick={() =>
                    handleChange(role.id, (counts[role.id] ?? 0) + 1)
                  }
                  disabled={props.disabled}
                >
                  +
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
