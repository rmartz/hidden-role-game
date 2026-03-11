"use client";

import { useEffect, useRef } from "react";
import { GameMode, RoleConfigMode } from "@/lib/types";
import { GAME_MODES, getRoleSlotsRequired } from "@/lib/game-modes";
import type { GameConfig, RoleSlot } from "@/server/types";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  loadConfig,
  setPlayerCount,
  setShowConfigToPlayers,
  setShowRolesInPlay,
} from "@/store/gameConfigSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RoleConfig } from "./RoleConfig";
import { GameModePicker } from "./GameModePicker";
import { ShowRolesInPlayPicker } from "./ShowRolesInPlayPicker";

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
  const roleConfigMode = useAppSelector((s) => s.gameConfig.roleConfigMode);
  const roleCounts = useAppSelector((s) => s.gameConfig.roleCounts);
  const roleMins = useAppSelector((s) => s.gameConfig.roleMins);
  const roleMaxes = useAppSelector((s) => s.gameConfig.roleMaxes);
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

  const activeGameMode = readOnly ? config.gameMode : selectedGameMode;
  const roleDefinitions = GAME_MODES[activeGameMode].roles;
  const ownerTitle = GAME_MODES[activeGameMode].ownerTitle;
  const roleSlotsRequired = getRoleSlotsRequired(activeGameMode, playerCount);

  const activeRoleConfigMode = readOnly
    ? config.roleConfigMode
    : roleConfigMode;

  const roleSlots: RoleSlot[] =
    activeRoleConfigMode === RoleConfigMode.Advanced
      ? Object.keys(roleDefinitions)
          .filter((id) => (roleMaxes[id] ?? 0) > 0)
          .map((id) => ({
            roleId: id,
            min: roleMins[id] ?? 0,
            max: roleMaxes[id] ?? 0,
          }))
      : Object.entries(roleCounts)
          .filter(([, count]) => count > 0)
          .map(([roleId, count]) => ({ roleId, min: count, max: count }));

  return (
    <>
      {readOnly ? (
        <p className="text-sm">
          Game Mode: <strong>{GAME_MODES[config.gameMode].name}</strong>
        </p>
      ) : (
        <GameModePicker />
      )}
      <Card className="@container mb-5">
        <CardHeader>
          <CardTitle>Game Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-6 @md:grid-cols-2">
            <div>
              {readOnly ? (
                <RoleConfig
                  roleDefinitions={roleDefinitions}
                  roleSlots={config.roleSlots}
                  roleConfigMode={config.roleConfigMode}
                  playerCount={playerCount}
                  gameMode={activeGameMode}
                  readOnly={true}
                />
              ) : (
                <RoleConfig
                  roleDefinitions={roleDefinitions}
                  playerCount={roleSlotsRequired}
                  roleConfigMode={roleConfigMode}
                  gameMode={selectedGameMode}
                  readOnly={false}
                  disabled={props.isPending}
                />
              )}
            </div>
            <div>
              <ShowRolesInPlayPicker
                value={readOnly ? config.showRolesInPlay : showRolesInPlay}
                disabled={readOnly ? true : props.isPending}
                onChange={
                  readOnly
                    ? undefined
                    : (value) => {
                        dispatch(setShowRolesInPlay(value));
                      }
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="show-config"
              checked={
                readOnly ? config.showConfigToPlayers : showConfigToPlayers
              }
              disabled={readOnly ? true : props.isPending}
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

          {ownerTitle && (
            <p className="text-sm text-muted-foreground">
              {readOnly
                ? `This game has a ${ownerTitle} who can see all roles.`
                : `You will be the ${ownerTitle} and will see all player roles. Role slots are for the remaining ${String(roleSlotsRequired)} players.`}
            </p>
          )}

          {!readOnly && (
            <Button
              onClick={() => {
                props.onStartGame(roleSlots, selectedGameMode);
              }}
              disabled={props.isPending || !isValid}
            >
              Start Game
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
