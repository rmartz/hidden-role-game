"use client";

import { useEffect, useRef } from "react";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/models";
import { GAME_MODES } from "@/lib/game-modes";
import type { GameConfig, RoleSlot } from "@/server/models";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  loadConfig,
  setGameMode,
  setPlayerCount,
  setRoleConfigMode,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RoleConfig } from "./RoleConfig";

const GAME_MODE_VALUES = new Set<string>(Object.values(GameMode));
function isGameMode(value: string | null): value is GameMode {
  return value !== null && GAME_MODE_VALUES.has(value);
}

const SHOW_ROLES_OPTIONS: {
  value: ShowRolesInPlay;
  title: string;
  description: string;
}[] = [
  {
    value: ShowRolesInPlay.None,
    title: "None",
    description: "Players cannot see which roles are in the game.",
  },
  {
    value: ShowRolesInPlay.ConfiguredOnly,
    title: "Configured only",
    description: "Players see the roles the owner configured, without counts.",
  },
  {
    value: ShowRolesInPlay.AssignedRolesOnly,
    title: "Assigned roles",
    description: "Players see only the roles that were actually assigned.",
  },
  {
    value: ShowRolesInPlay.RoleAndCount,
    title: "Role and count",
    description: "Players see each role and how many copies are in play.",
  },
];

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
  const roleSlotsRequired = playerCount - (ownerTitle ? 1 : 0);

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
      <Card className="mb-5">
        <CardHeader>
          <CardTitle>Game Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
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
            <div className="space-y-1">
              <Label>Show roles in play</Label>
              <RadioGroup
                value={readOnly ? config.showRolesInPlay : showRolesInPlay}
                disabled={readOnly ? true : props.isPending}
                onValueChange={(value) => {
                  if (value !== null)
                    dispatch(setShowRolesInPlay(value as ShowRolesInPlay));
                }}
              >
                <FieldGroup>
                  {SHOW_ROLES_OPTIONS.map((opt) => (
                    <Label key={opt.value} htmlFor={opt.value}>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>{opt.title}</FieldTitle>
                          <FieldDescription>{opt.description}</FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value={opt.value} id={opt.value} />
                      </Field>
                    </Label>
                  ))}
                </FieldGroup>
              </RadioGroup>
            </div>
          </div>

          {ownerTitle && (
            <p className="text-sm text-muted-foreground">
              {readOnly
                ? `This game has a ${ownerTitle} who can see all roles.`
                : `You will be the ${ownerTitle} and will see all player roles. Role slots are for the remaining ${String(roleSlotsRequired)} players.`}
            </p>
          )}

          {!readOnly && (
            <div className="space-y-1">
              <Label>Role configuration</Label>
              <Tabs
                value={roleConfigMode}
                onValueChange={(value) => {
                  dispatch(setRoleConfigMode(value as RoleConfigMode));
                }}
              >
                <TabsList>
                  {Object.values(RoleConfigMode).map((mode) => (
                    <TabsTrigger
                      key={mode}
                      value={mode}
                      disabled={props.isPending}
                    >
                      {mode}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}

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
            <>
              <RoleConfig
                roleDefinitions={roleDefinitions}
                playerCount={roleSlotsRequired}
                roleConfigMode={roleConfigMode}
                gameMode={selectedGameMode}
                readOnly={false}
                disabled={
                  props.isPending || roleConfigMode === RoleConfigMode.Default
                }
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
    </>
  );
}
