import type { GameMode, RoleDefinition, Team } from "@/lib/models";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  incrementRoleCount,
  decrementRoleCount,
  setRoleMin,
  setRoleMax,
} from "@/store/gameConfigSlice";
import { RoleLabel } from "@/components/RoleLabel";
import { Button } from "@/components/ui/button";

interface ReadOnlyProps {
  role: RoleDefinition<string, Team>;
  gameMode: GameMode;
  isAdvanced: boolean;
  min: number;
  max: number;
  readOnly: true;
}

interface EditableProps {
  role: RoleDefinition<string, Team>;
  gameMode: GameMode;
  isAdvanced: boolean;
  readOnly: false;
  disabled: boolean;
}

type Props = ReadOnlyProps | EditableProps;

export function RoleConfigEntry(props: Props) {
  const { role, gameMode, isAdvanced, readOnly } = props;

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
        isAdvanced ? (
          <span className="text-sm">
            {props.min}–{props.max}
          </span>
        ) : (
          <span className="text-sm">{props.min}</span>
        )
      ) : isAdvanced ? (
        <>
          <span className="text-sm text-muted-foreground">Min:</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              dispatch(setRoleMin({ roleId: role.id, min: min - 1 }));
            }}
            disabled={props.disabled || min === 0}
          >
            −
          </Button>
          <span className="w-6 text-center text-sm">{min}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              dispatch(setRoleMin({ roleId: role.id, min: min + 1 }));
            }}
            disabled={props.disabled}
          >
            +
          </Button>
          <span className="text-sm text-muted-foreground ml-2">Max:</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              dispatch(setRoleMax({ roleId: role.id, max: max - 1 }));
            }}
            disabled={props.disabled || max === 0}
          >
            −
          </Button>
          <span className="w-6 text-center text-sm">{max}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              dispatch(setRoleMax({ roleId: role.id, max: max + 1 }));
            }}
            disabled={props.disabled}
          >
            +
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              dispatch(decrementRoleCount(role.id));
            }}
            disabled={props.disabled || count === 0}
          >
            −
          </Button>
          <span className="w-6 text-center text-sm">{count}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              dispatch(incrementRoleCount(role.id));
            }}
            disabled={props.disabled}
          >
            +
          </Button>
        </>
      )}
    </li>
  );
}
