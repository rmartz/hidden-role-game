import type { GameMode, RoleDefinition, Team } from "@/lib/models";
import { RoleConfigMode } from "@/lib/models";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  incrementRoleCount,
  decrementRoleCount,
  setRoleMin,
  setRoleMax,
} from "@/store/gameConfigSlice";
import { RoleLabel } from "@/components/RoleLabel";
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

  return (
    <li className="flex items-center gap-2 py-1">
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
        <>
          <span className="text-sm text-muted-foreground">Min:</span>
          <Incrementer
            value={min}
            onDecrement={() => {
              dispatch(setRoleMin({ roleId: role.id, min: min - 1 }));
            }}
            onIncrement={() => {
              dispatch(setRoleMin({ roleId: role.id, min: min + 1 }));
            }}
            decrementDisabled={props.disabled || min === 0}
            incrementDisabled={props.disabled}
          />
          <span className="text-sm text-muted-foreground ml-2">Max:</span>
          <Incrementer
            value={max}
            onDecrement={() => {
              dispatch(setRoleMax({ roleId: role.id, max: max - 1 }));
            }}
            onIncrement={() => {
              dispatch(setRoleMax({ roleId: role.id, max: max + 1 }));
            }}
            decrementDisabled={props.disabled || max === 0}
            incrementDisabled={props.disabled}
          />
        </>
      ) : roleConfigMode === RoleConfigMode.Custom ? (
        <Incrementer
          value={count}
          onDecrement={() => {
            dispatch(decrementRoleCount(role.id));
          }}
          onIncrement={() => {
            dispatch(incrementRoleCount(role.id));
          }}
          decrementDisabled={props.disabled || count === 0}
          incrementDisabled={props.disabled}
        />
      ) : (
        <span className="text-sm text-muted-foreground">{count}</span>
      )}
    </li>
  );
}
