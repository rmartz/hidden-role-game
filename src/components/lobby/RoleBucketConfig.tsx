"use client";

import type { RoleBucket, RoleDefinition, Team, GameMode } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addBucket,
  removeBucket,
  setBucketPlayerCount,
  addRoleToBucket,
  removeRoleFromBucket,
  setBucketRoleUnique,
  setBucketRoleMin,
} from "@/store/game-config-slice";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleLabel } from "@/components/RoleLabel";
import { Incrementer } from "./Incrementer";
import { ROLE_BUCKET_CONFIG_COPY } from "./RoleBucketConfig.copy";

interface RoleBucketConfigProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  gameMode: GameMode;
  disabled: boolean;
}

export function RoleBucketConfig({
  roleDefinitions,
  gameMode,
  disabled,
}: RoleBucketConfigProps) {
  const dispatch = useAppDispatch();
  const buckets = useAppSelector((s) => s.gameConfig.roleBuckets);
  const allRoles = Object.values(roleDefinitions);

  return (
    <div className="space-y-4">
      {buckets.map((bucket, bucketIndex) => (
        <BucketEditor
          key={bucketIndex}
          bucket={bucket}
          bucketIndex={bucketIndex}
          allRoles={allRoles}
          gameMode={gameMode}
          disabled={disabled}
          onRemove={() => dispatch(removeBucket(bucketIndex))}
          onSetPlayerCount={(count) =>
            dispatch(setBucketPlayerCount({ bucketIndex, playerCount: count }))
          }
          onAddRole={(roleId) =>
            dispatch(addRoleToBucket({ bucketIndex, roleId }))
          }
          onRemoveRole={(roleId) =>
            dispatch(removeRoleFromBucket({ bucketIndex, roleId }))
          }
          onSetUnique={(roleId, unique) =>
            dispatch(setBucketRoleUnique({ bucketIndex, roleId, unique }))
          }
          onSetMin={(roleId, min) =>
            dispatch(setBucketRoleMin({ bucketIndex, roleId, min }))
          }
        />
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => dispatch(addBucket())}
      >
        {ROLE_BUCKET_CONFIG_COPY.addBucket}
      </Button>
    </div>
  );
}

interface BucketEditorProps {
  bucket: RoleBucket;
  bucketIndex: number;
  allRoles: RoleDefinition<string, Team>[];
  gameMode: GameMode;
  disabled: boolean;
  onRemove: () => void;
  onSetPlayerCount: (count: number) => void;
  onAddRole: (roleId: string) => void;
  onRemoveRole: (roleId: string) => void;
  onSetUnique: (roleId: string, unique: boolean) => void;
  onSetMin: (roleId: string, min: number) => void;
}

function BucketEditor({
  bucket,
  bucketIndex,
  allRoles,
  gameMode,
  disabled,
  onRemove,
  onSetPlayerCount,
  onAddRole,
  onRemoveRole,
  onSetUnique,
  onSetMin,
}: BucketEditorProps) {
  const assignedRoleIds = new Set(bucket.roles.map((r) => r.roleId));
  const availableRoles = allRoles.filter((r) => !assignedRoleIds.has(r.id));

  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {ROLE_BUCKET_CONFIG_COPY.bucketLabel(bucketIndex)}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {ROLE_BUCKET_CONFIG_COPY.playerCount}
          </span>
          <Incrementer
            value={bucket.playerCount}
            onChange={(dir) => {
              onSetPlayerCount(
                dir === "increment"
                  ? bucket.playerCount + 1
                  : bucket.playerCount - 1,
              );
            }}
            disabled={disabled}
            minValue={1}
          />
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onRemove}
          >
            {ROLE_BUCKET_CONFIG_COPY.removeBucket}
          </Button>
        </div>
      </div>

      {bucket.roles.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {ROLE_BUCKET_CONFIG_COPY.noRoles}
        </p>
      ) : (
        <ul className="space-y-1 list-none p-0">
          {bucket.roles.map((slot) => {
            const roleDef = allRoles.find((r) => r.id === slot.roleId);
            return (
              <li
                key={slot.roleId}
                className="grid grid-cols-[1fr_auto] items-center gap-2 py-0.5"
              >
                <span className="flex items-center gap-1 min-w-0">
                  {roleDef ? (
                    <RoleLabel role={roleDef} gameMode={gameMode} />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {slot.roleId}
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Min</span>
                    <Incrementer
                      value={slot.min}
                      onChange={(dir) => {
                        onSetMin(
                          slot.roleId,
                          dir === "increment" ? slot.min + 1 : slot.min - 1,
                        );
                      }}
                      disabled={disabled}
                      minValue={0}
                    />
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={slot.max !== undefined}
                      onCheckedChange={(checked) => {
                        onSetUnique(slot.roleId, checked);
                      }}
                      disabled={disabled}
                    />
                    <span className="text-xs">
                      {ROLE_BUCKET_CONFIG_COPY.unique}
                    </span>
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={() => {
                      onRemoveRole(slot.roleId);
                    }}
                  >
                    {ROLE_BUCKET_CONFIG_COPY.removeRole}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {availableRoles.length > 0 && (
        <Select
          disabled={disabled}
          onValueChange={(roleId) => {
            onAddRole(roleId as string);
          }}
        >
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder={ROLE_BUCKET_CONFIG_COPY.addRole} />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
