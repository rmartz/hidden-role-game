"use client";

import type { GameMode } from "@/lib/types";
import {
  ENABLED_GAME_MODES,
  GAME_MODES,
  isGameModeEnabled,
  parseGameMode,
} from "@/lib/game-modes";
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

function isEnabledGameMode(value: string | null): value is GameMode {
  if (value === null) return false;
  const parsed = parseGameMode(value);
  return parsed !== undefined && isGameModeEnabled(parsed);
}

export function GameModePicker() {
  const dispatch = useAppDispatch();
  const selectedGameMode = useAppSelector((s) => s.gameConfig.gameMode);

  return (
    <div className="space-y-1">
      <Label>{GAME_MODE_PICKER_COPY.label}</Label>
      <Select
        value={selectedGameMode}
        onValueChange={(value) => {
          if (isEnabledGameMode(value)) dispatch(setGameMode(value));
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue>{GAME_MODES[selectedGameMode].name}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ENABLED_GAME_MODES.map((mode) => (
            <SelectItem key={mode} value={mode}>
              {GAME_MODES[mode].name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
