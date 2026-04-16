"use client";

import type {
  AdvancedRoleBucket,
  RoleDefinition,
  Team,
  GameMode,
} from "@/lib/types";
import { isSimpleRoleBucket } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addBucket,
  removeBucket,
  setBucketPlayerCount,
  setBucketName,
  addRoleToBucket,
  removeRoleFromBucket,
  setBucketUnique,
} from "@/store/game-config-slice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  const advancedBuckets = buckets.filter(
    (b): b is AdvancedRoleBucket => !isSimpleRoleBucket(b),
  );
  const allRoles = Object.values(roleDefinitions);

  return (
    <RoleBucketConfigView
      buckets={advancedBuckets}
      allRoles={allRoles}
      gameMode={gameMode}
      disabled={disabled}
      onAddBucket={() => {
        dispatch(addBucket());
      }}
      onRemoveBucket={(i) => {
        dispatch(removeBucket(i));
      }}
      onSetBucketName={(i, name) => {
        dispatch(setBucketName({ bucketIndex: i, name }));
      }}
      onSetBucketPlayerCount={(i, count) => {
        dispatch(setBucketPlayerCount({ bucketIndex: i, playerCount: count }));
      }}
      onAddRole={(i, roleId, bucketIsUnique) => {
        dispatch(addRoleToBucket({ bucketIndex: i, roleId, bucketIsUnique }));
      }}
      onRemoveRole={(i, roleId) => {
        dispatch(removeRoleFromBucket({ bucketIndex: i, roleId }));
      }}
      onSetBucketUnique={(i, unique) => {
        dispatch(setBucketUnique({ bucketIndex: i, unique }));
      }}
    />
  );
}

export interface RoleBucketConfigViewProps {
  buckets: AdvancedRoleBucket[];
  allRoles: RoleDefinition<string, Team>[];
  gameMode: GameMode;
  disabled: boolean;
  onAddBucket: () => void;
  onRemoveBucket: (bucketIndex: number) => void;
  onSetBucketName: (bucketIndex: number, name: string) => void;
  onSetBucketPlayerCount: (bucketIndex: number, count: number) => void;
  onAddRole: (
    bucketIndex: number,
    roleId: string,
    bucketIsUnique: boolean,
  ) => void;
  onRemoveRole: (bucketIndex: number, roleId: string) => void;
  onSetBucketUnique: (bucketIndex: number, unique: boolean) => void;
}

export function RoleBucketConfigView({
  buckets,
  allRoles,
  gameMode,
  disabled,
  onAddBucket,
  onRemoveBucket,
  onSetBucketName,
  onSetBucketPlayerCount,
  onAddRole,
  onRemoveRole,
  onSetBucketUnique,
}: RoleBucketConfigViewProps) {
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
          onRemove={() => {
            onRemoveBucket(bucketIndex);
          }}
          onSetName={(name) => {
            onSetBucketName(bucketIndex, name);
          }}
          onSetPlayerCount={(count) => {
            onSetBucketPlayerCount(bucketIndex, count);
          }}
          onAddRole={(roleId, bucketIsUnique) => {
            onAddRole(bucketIndex, roleId, bucketIsUnique);
          }}
          onRemoveRole={(roleId) => {
            onRemoveRole(bucketIndex, roleId);
          }}
          onSetBucketUnique={(unique) => {
            onSetBucketUnique(bucketIndex, unique);
          }}
        />
      ))}
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onAddBucket}
      >
        {ROLE_BUCKET_CONFIG_COPY.addBucket}
      </Button>
    </div>
  );
}

interface BucketEditorProps {
  bucket: AdvancedRoleBucket;
  bucketIndex: number;
  allRoles: RoleDefinition<string, Team>[];
  gameMode: GameMode;
  disabled: boolean;
  onRemove: () => void;
  onSetName: (name: string) => void;
  onSetPlayerCount: (count: number) => void;
  onAddRole: (roleId: string, bucketIsUnique: boolean) => void;
  onRemoveRole: (roleId: string) => void;
  onSetBucketUnique: (unique: boolean) => void;
}

function BucketEditor({
  bucket,
  bucketIndex,
  allRoles,
  gameMode,
  disabled,
  onRemove,
  onSetName,
  onSetPlayerCount,
  onAddRole,
  onRemoveRole,
  onSetBucketUnique,
}: BucketEditorProps) {
  const assignedRoleIds = new Set(bucket.roles.map((r) => r.roleId));
  const availableRoles = allRoles.filter((r) => !assignedRoleIds.has(r.id));

  const roleDefById = new Map(allRoles.map((r) => [r.id, r]));
  const nonUniqueSlots = bucket.roles.filter(
    (slot) => !roleDefById.get(slot.roleId)?.unique,
  );
  const hasNonUniqueRoles = nonUniqueSlots.length > 0;
  const bucketIsUnique =
    hasNonUniqueRoles && nonUniqueSlots.every((s) => s.max === 1);

  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Input
          className="h-7 text-sm font-medium w-40 px-2"
          value={bucket.name ?? ""}
          onChange={(e) => {
            onSetName(e.target.value);
          }}
          placeholder={ROLE_BUCKET_CONFIG_COPY.bucketNamePlaceholder(
            bucketIndex,
          )}
          disabled={disabled}
        />
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
                  {roleDef?.unique && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {ROLE_BUCKET_CONFIG_COPY.uniqueBadge}
                    </Badge>
                  )}
                </span>
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
              </li>
            );
          })}
        </ul>
      )}

      {hasNonUniqueRoles && (
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={bucketIsUnique}
            onCheckedChange={(checked) => {
              onSetBucketUnique(checked);
            }}
            disabled={disabled}
          />
          <span className="text-xs">
            {ROLE_BUCKET_CONFIG_COPY.bucketUnique}
          </span>
        </label>
      )}

      {availableRoles.length > 0 && (
        <Select
          disabled={disabled}
          onValueChange={(roleId) => {
            if (!roleId) return;
            onAddRole(roleId as string, bucketIsUnique);
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
