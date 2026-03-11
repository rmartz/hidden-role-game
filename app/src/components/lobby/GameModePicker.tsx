"use client";

import { GameMode } from "@/lib/types";
import { GAME_MODES } from "@/lib/game-modes";
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

const GAME_MODE_VALUES = new Set<string>(Object.values(GameMode));
function isGameMode(value: string | null): value is GameMode {
  return value !== null && GAME_MODE_VALUES.has(value);
}

export function GameModePicker() {
  const dispatch = useAppDispatch();
  const selectedGameMode = useAppSelector((s) => s.gameConfig.gameMode);

  return (
    <div className="space-y-1">
      <Label>Game Mode</Label>
      <Select
        value={selectedGameMode}
        onValueChange={(value) => {
          if (isGameMode(value)) dispatch(setGameMode(value));
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue>{GAME_MODES[selectedGameMode].name}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.values(GameMode).map((mode) => (
            <SelectItem key={mode} value={mode}>
              {GAME_MODES[mode].name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
