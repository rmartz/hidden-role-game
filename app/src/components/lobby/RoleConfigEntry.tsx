import type { GameMode, RoleDefinition, Team } from "@/lib/types";
import { RoleConfigMode } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  incrementRoleCount,
  decrementRoleCount,
  setRoleMin,
  setRoleMax,
} from "@/store/game-config-slice";
import { RoleLabel } from "@/components/RoleLabel";
import type { IncrementDirection } from "./Incrementer";
import { Incrementer } from "./Incrementer";

interface ReadOnlyProps {
  role: RoleDefinition<string, Team>;
  gameMode: GameMode;
  roleConfigMode: RoleConfigMode;
  min: number;
  max: number;
  readOnly: true;
}

interface EditableProps {
  role: RoleDefinition<string, Team>;
  gameMode: GameMode;
  roleConfigMode: RoleConfigMode;
  readOnly: false;
  disabled: boolean;
}

type Props = ReadOnlyProps | EditableProps;

export function RoleConfigEntry(props: Props) {
  const { role, gameMode, roleConfigMode, readOnly } = props;

  const dispatch = useAppDispatch();
  const count = useAppSelector((s) => s.gameConfig.roleCounts[role.id] ?? 0);
  const min = useAppSelector((s) => s.gameConfig.roleMins[role.id] ?? 0);
  const max = useAppSelector((s) => s.gameConfig.roleMaxes[role.id] ?? 0);

  function handleCountChange(direction: IncrementDirection) {
    if (direction === "increment") {
      dispatch(incrementRoleCount(role.id));
    } else {
      dispatch(decrementRoleCount(role.id));
    }
  }

  function handleMinChange(direction: IncrementDirection) {
    dispatch(
      setRoleMin({
        roleId: role.id,
        min: direction === "increment" ? min + 1 : min - 1,
      }),
    );
  }

  function handleMaxChange(direction: IncrementDirection) {
    dispatch(
      setRoleMax({
        roleId: role.id,
        max: direction === "increment" ? max + 1 : max - 1,
      }),
    );
  }

  const isAdvanced = !readOnly && roleConfigMode === RoleConfigMode.Advanced;

  return (
    <li
      className={`py-1 ${isAdvanced ? "flex flex-col gap-1" : "flex items-start gap-2"}`}
    >
      <span className="min-w-40">
        <RoleLabel role={role} gameMode={gameMode} />
      </span>
      {readOnly ? (
        roleConfigMode === RoleConfigMode.Advanced ? (
          <span className="text-sm">
            {props.min}–{props.max}
          </span>
        ) : (
          <span className="text-sm">{props.min}</span>
        )
      ) : roleConfigMode === RoleConfigMode.Advanced ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Min:</span>
            <Incrementer
              value={min}
              onChange={handleMinChange}
              disabled={props.disabled}
              minValue={0}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Max:</span>
            <Incrementer
              value={max}
              onChange={handleMaxChange}
              disabled={props.disabled}
              minValue={0}
            />
          </div>
        </div>
      ) : roleConfigMode === RoleConfigMode.Custom ? (
        <Incrementer
          value={count}
          onChange={handleCountChange}
          disabled={props.disabled}
          minValue={0}
        />
      ) : (
        <span className="text-sm text-muted-foreground">{count}</span>
      )}
    </li>
  );
}
