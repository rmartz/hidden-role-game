"use client";

import type { GameMode } from "@/lib/types";
import {
  ALL_GAME_MODES,
  ENABLED_GAME_MODES,
  GAME_MODES,
  isGameModeEnabled,
  parseGameMode,
} from "@/lib/game/modes";
import { useAppDispatch, useAppSelector } from "@/store";
import { setGameMode } from "@/store/game-config-slice";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GAME_MODE_PICKER_COPY } from "./GameModePicker.copy";

interface GameModePickerProps {
  showUnreleased?: boolean;
}

function isSelectableGameMode(
  value: string | null,
  showUnreleased: boolean,
): value is GameMode {
  if (value === null) return false;
  const parsed = parseGameMode(value);
  return parsed !== undefined && (showUnreleased || isGameModeEnabled(parsed));
}

export function GameModePicker({
  showUnreleased = false,
}: GameModePickerProps) {
  const dispatch = useAppDispatch();
  const selectedGameMode = useAppSelector((s) => s.gameConfig.gameMode);
  const availableModes = showUnreleased ? ALL_GAME_MODES : ENABLED_GAME_MODES;

  return (
    <div className="space-y-1">
      <Label>{GAME_MODE_PICKER_COPY.label}</Label>
      <Select
        value={selectedGameMode}
        onValueChange={(value) => {
          if (isSelectableGameMode(value, showUnreleased))
            dispatch(setGameMode(value));
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue>{GAME_MODES[selectedGameMode].name}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableModes.map((mode) => (
            <SelectItem key={mode} value={mode}>
              {GAME_MODES[mode].name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
