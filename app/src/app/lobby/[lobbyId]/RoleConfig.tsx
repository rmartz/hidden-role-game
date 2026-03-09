import { useState } from "react";
import { keyBy, mapValues, pickBy, sum } from "lodash";
import type { RoleDefinition, Team } from "@/lib/models";
import type { RoleSlot } from "@/server/models";

interface ReadOnlyProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  roleSlots?: RoleSlot[];
  playerCount: number;
  readOnly: true;
}

interface EditableProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  roleSlots?: RoleSlot[];
  playerCount: number;
  readOnly: false;
  disabled: boolean;
  onRoleSlotsChange: (roleSlots: RoleSlot[]) => void;
}

type Props = ReadOnlyProps | EditableProps;

export default function RoleConfig(props: Props) {
  const { roleDefinitions, playerCount, readOnly } = props;

  const slotCounts = keyBy(!readOnly ? props.roleSlots : [], "roleId");
  const [counts, setCounts] = useState<Record<string, number>>(
    mapValues(roleDefinitions, (_, roleId) => slotCounts[roleId]?.count ?? 0),
  );

  const total = sum(Object.values(counts));

  function handleChange(roleId: string, value: number) {
    const newCounts = { ...counts, [roleId]: Math.max(0, value) };
    setCounts(newCounts);
    if (!readOnly) {
      const roleSlots = Object.entries(pickBy(newCounts, (v) => v > 0)).map(
        ([roleId, count]) => ({ roleId, count }),
      );
      props.onRoleSlotsChange(roleSlots);
    }
  }

  const displayCounts = readOnly
    ? mapValues(keyBy(props.roleSlots ?? [], "roleId"), (s) => s.count)
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
        {Object.values(roleDefinitions).map((role) => (
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
                  onClick={() => {
                    handleChange(role.id, (counts[role.id] ?? 0) - 1);
                  }}
                  disabled={props.disabled || (counts[role.id] ?? 0) === 0}
                >
                  -
                </button>
                <span>{counts[role.id] ?? 0}</span>
                <button
                  onClick={() => {
                    handleChange(role.id, (counts[role.id] ?? 0) + 1);
                  }}
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
