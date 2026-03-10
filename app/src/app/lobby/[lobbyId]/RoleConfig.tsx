import { sum } from "lodash";
import type { RoleDefinition, RoleSlot, Team } from "@/lib/models";
import { RoleConfigMode } from "@/lib/models";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  incrementRoleCount,
  decrementRoleCount,
  setRoleMin,
  setRoleMax,
} from "@/store/gameConfigSlice";

interface ReadOnlyProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  roleSlots?: RoleSlot[];
  roleConfigMode: RoleConfigMode;
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
  const roleMins = useAppSelector((s) => s.gameConfig.roleMins);
  const roleMaxes = useAppSelector((s) => s.gameConfig.roleMaxes);
  const roleConfigMode = useAppSelector((s) => s.gameConfig.roleConfigMode);

  const isAdvanced = readOnly
    ? props.roleConfigMode === RoleConfigMode.Advanced
    : roleConfigMode === RoleConfigMode.Advanced;

  // For readonly display, build counts/ranges from roleSlots prop.
  const readOnlyMin = readOnly
    ? Object.fromEntries((props.roleSlots ?? []).map((s) => [s.roleId, s.min]))
    : {};
  const readOnlyMax = readOnly
    ? Object.fromEntries((props.roleSlots ?? []).map((s) => [s.roleId, s.max]))
    : {};

  const total = readOnly ? 0 : sum(Object.values(roleCounts));

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Configure Roles</h2>
      {!readOnly && (
        <p>
          {roleConfigMode === RoleConfigMode.Advanced
            ? `Assign ${String(playerCount)} role${playerCount !== 1 ? "s" : ""} (min total: ${String(sum(Object.values(roleMins)))}, max total: ${String(sum(Object.values(roleMaxes)))})`
            : `Assign ${String(playerCount)} role${playerCount !== 1 ? "s" : ""} (${String(total)}/${String(playerCount)} assigned)`}
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
              isAdvanced ? (
                <span>
                  {readOnlyMin[role.id] ?? 0}–{readOnlyMax[role.id] ?? 0}
                </span>
              ) : (
                <span>{readOnlyMin[role.id] ?? 0}</span>
              )
            ) : isAdvanced ? (
              <>
                <label
                  style={{ display: "flex", gap: "4px", alignItems: "center" }}
                >
                  Min:
                  <button
                    onClick={() =>
                      dispatch(
                        setRoleMin({
                          roleId: role.id,
                          min: (roleMins[role.id] ?? 0) - 1,
                        }),
                      )
                    }
                    disabled={props.disabled || (roleMins[role.id] ?? 0) === 0}
                  >
                    -
                  </button>
                  <span>{roleMins[role.id] ?? 0}</span>
                  <button
                    onClick={() =>
                      dispatch(
                        setRoleMin({
                          roleId: role.id,
                          min: (roleMins[role.id] ?? 0) + 1,
                        }),
                      )
                    }
                    disabled={props.disabled}
                  >
                    +
                  </button>
                </label>
                <label
                  style={{ display: "flex", gap: "4px", alignItems: "center" }}
                >
                  Max:
                  <button
                    onClick={() =>
                      dispatch(
                        setRoleMax({
                          roleId: role.id,
                          max: (roleMaxes[role.id] ?? 0) - 1,
                        }),
                      )
                    }
                    disabled={props.disabled || (roleMaxes[role.id] ?? 0) === 0}
                  >
                    -
                  </button>
                  <span>{roleMaxes[role.id] ?? 0}</span>
                  <button
                    onClick={() =>
                      dispatch(
                        setRoleMax({
                          roleId: role.id,
                          max: (roleMaxes[role.id] ?? 0) + 1,
                        }),
                      )
                    }
                    disabled={props.disabled}
                  >
                    +
                  </button>
                </label>
              </>
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
