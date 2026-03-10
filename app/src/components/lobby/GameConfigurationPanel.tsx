"use client";

import { useEffect, useRef } from "react";
import { GameMode } from "@/lib/models";
import { GAME_MODES } from "@/lib/game-modes";
import type { GameConfig, RoleSlot } from "@/server/models";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  loadConfig,
  setGameMode,
  setPlayerCount,
  setShowConfigToPlayers,
  setShowRolesInPlay,
} from "@/store/gameConfigSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleConfig } from "./RoleConfig";

const GAME_MODE_VALUES = new Set<string>(Object.values(GameMode));
function isGameMode(value: string | null): value is GameMode {
  return value !== null && GAME_MODE_VALUES.has(value);
}

interface ReadOnlyProps {
  config: GameConfig;
  playerCount: number;
  readOnly: true;
}

interface EditableProps {
  config: GameConfig;
  playerCount: number;
  readOnly: false;
  isPending: boolean;
  onStartGame: (roleSlots: RoleSlot[], gameMode: GameMode) => void;
}

type Props = ReadOnlyProps | EditableProps;

export function GameConfigurationPanel(props: Props) {
  const { config, playerCount, readOnly } = props;

  const dispatch = useAppDispatch();
  const selectedGameMode = useAppSelector((s) => s.gameConfig.gameMode);
  const showConfigToPlayers = useAppSelector(
    (s) => s.gameConfig.showConfigToPlayers,
  );
  const showRolesInPlay = useAppSelector((s) => s.gameConfig.showRolesInPlay);
  const roleCounts = useAppSelector((s) => s.gameConfig.roleCounts);
  const isValid = useAppSelector((s) => s.gameConfig.isValid);

  const hasLoadedRef = useRef(false);
  const prevPlayerCountRef = useRef(playerCount);
  useEffect(() => {
    if (readOnly) return;
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      prevPlayerCountRef.current = playerCount;
      dispatch(loadConfig({ config, playerCount }));
      return;
    }
    if (prevPlayerCountRef.current !== playerCount) {
      prevPlayerCountRef.current = playerCount;
      dispatch(setPlayerCount(playerCount));
    }
  }, [config, playerCount, readOnly, dispatch]);

  const roleDefinitions =
    GAME_MODES[readOnly ? config.gameMode : selectedGameMode].roles;
  const ownerTitle =
    GAME_MODES[readOnly ? config.gameMode : selectedGameMode].ownerTitle;
  const roleSlotsRequired = playerCount - (ownerTitle ? 1 : 0);

  const roleSlots: RoleSlot[] = Object.entries(roleCounts)
    .filter(([, count]) => count > 0)
    .map(([roleId, count]) => ({ roleId, count }));

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Game Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {readOnly ? (
          <p className="text-sm">
            Game Mode: <strong>{GAME_MODES[config.gameMode].name}</strong>
          </p>
        ) : (
          <div className="space-y-1">
            <Label>Game Mode</Label>
            <Select
              value={selectedGameMode}
              onValueChange={(value) => {
                if (isGameMode(value)) dispatch(setGameMode(value));
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
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
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-config"
              checked={
                readOnly ? config.showConfigToPlayers : showConfigToPlayers
              }
              disabled={readOnly || props.isPending}
              onCheckedChange={
                readOnly
                  ? undefined
                  : (checked) => {
                      dispatch(setShowConfigToPlayers(checked));
                    }
              }
            />
            <Label htmlFor="show-config">
              Show game configuration to all players
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-roles"
              checked={readOnly ? config.showRolesInPlay : showRolesInPlay}
              disabled={readOnly || props.isPending}
              onCheckedChange={
                readOnly
                  ? undefined
                  : (checked) => {
                      dispatch(setShowRolesInPlay(checked));
                    }
              }
            />
            <Label htmlFor="show-roles">
              Show roles in play when game starts
            </Label>
          </div>
        </div>

        {ownerTitle && (
          <p className="text-sm text-muted-foreground">
            {readOnly
              ? `This game has a ${ownerTitle} who can see all roles.`
              : `You will be the ${ownerTitle} and will see all player roles. Role slots are for the remaining ${String(roleSlotsRequired)} players.`}
          </p>
        )}

        {readOnly ? (
          <RoleConfig
            roleDefinitions={roleDefinitions}
            roleSlots={config.roleSlots}
            playerCount={playerCount}
            gameMode={selectedGameMode}
            readOnly={true}
          />
        ) : (
          <>
            <RoleConfig
              roleDefinitions={roleDefinitions}
              playerCount={roleSlotsRequired}
              gameMode={selectedGameMode}
              readOnly={false}
              disabled={props.isPending}
            />
            <Button
              onClick={() => {
                props.onStartGame(roleSlots, selectedGameMode);
              }}
              disabled={props.isPending || !isValid}
            >
              Start Game
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
