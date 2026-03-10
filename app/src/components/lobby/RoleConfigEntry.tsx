import type { GameMode, RoleDefinition, Team } from "@/lib/models";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  incrementRoleCount,
  decrementRoleCount,
} from "@/store/gameConfigSlice";
import { RoleLabel } from "@/components/game";
import { Button } from "@/components/ui/button";

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
    <li className="flex items-center gap-2 py-1">
      <span className="min-w-40">
        <RoleLabel role={role} gameMode={gameMode} />
      </span>
      {readOnly ? (
        <span className="text-sm">{props.count}</span>
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
