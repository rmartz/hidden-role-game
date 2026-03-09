import { keyBy, mapValues, sum } from "lodash";
import type { RoleDefinition, Team } from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  incrementRoleCount,
  decrementRoleCount,
} from "@/store/gameConfigSlice";

interface ReadOnlyProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  roleSlots?: RoleSlot[];
  playerCount: number;
  readOnly: true;
}

interface EditableProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  playerCount: number;
  readOnly: false;
  disabled: boolean;
}

type Props = ReadOnlyProps | EditableProps;

export default function RoleConfig(props: Props) {
  const { roleDefinitions, playerCount, readOnly } = props;

  const dispatch = useAppDispatch();
  const roleCounts = useAppSelector((s) => s.gameConfig.roleCounts);

  const displayCounts = readOnly
    ? mapValues(keyBy(props.roleSlots ?? [], "roleId"), (s) => s.count)
    : roleCounts;

  const total = readOnly ? 0 : sum(Object.values(roleCounts));

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
                    dispatch(decrementRoleCount(role.id));
                  }}
                  disabled={props.disabled || (roleCounts[role.id] ?? 0) === 0}
                >
                  -
                </button>
                <span>{roleCounts[role.id] ?? 0}</span>
                <button
                  onClick={() => {
                    dispatch(incrementRoleCount(role.id));
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
