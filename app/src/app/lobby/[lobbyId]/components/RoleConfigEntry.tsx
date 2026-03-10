import type { GameMode, RoleDefinition, Team } from "@/lib/models";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  incrementRoleCount,
  decrementRoleCount,
} from "@/store/gameConfigSlice";
import { RoleLabel } from "@/app/game/[gameId]/components";

interface ReadOnlyProps {
  role: RoleDefinition<string, Team>;
  count: number;
  gameMode: GameMode;
  readOnly: true;
}

interface EditableProps {
  role: RoleDefinition<string, Team>;
  gameMode: GameMode;
  readOnly: false;
  disabled: boolean;
}

type Props = ReadOnlyProps | EditableProps;

export function RoleConfigEntry(props: Props) {
  const { role, gameMode, readOnly } = props;

  const dispatch = useAppDispatch();
  const count = useAppSelector((s) => s.gameConfig.roleCounts[role.id] ?? 0);

  return (
    <li
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "center",
        marginBottom: "4px",
      }}
    >
      <span style={{ minWidth: "160px" }}>
        <RoleLabel role={role} gameMode={gameMode} />
      </span>
      {readOnly ? (
        <span>{props.count}</span>
      ) : (
        <>
          <button
            onClick={() => {
              dispatch(decrementRoleCount(role.id));
            }}
            disabled={props.disabled || count === 0}
          >
            -
          </button>
          <span>{count}</span>
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
  );
}
