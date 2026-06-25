"use client";

import { RoleLabel } from "@/components/RoleLabel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getAdvancedBucketMaxCapacity } from "@/lib/game/modes";
import type {
  AdvancedRoleBucket,
  GameMode,
  RoleDefinition,
  Team,
} from "@/lib/types";
import { isSimpleRoleBucket } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addBucket,
  addRoleToBucket,
  removeBucket,
  removeRoleFromBucket,
  setBucketName,
  setBucketPlayerCount,
  setBucketUnique,
} from "@/store/game-config-slice";

import { Incrementer } from "./Incrementer";
import { RoleBucketAddDialog } from "./RoleBucketAddDialog";
import { ROLE_BUCKET_CONFIG_COPY } from "./RoleBucketConfig.copy";

interface RoleBucketConfigProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  gameMode: GameMode;
  disabled: boolean;
  categoryOrder?: string[];
  categoryLabels?: Record<string, string>;
}

export function RoleBucketConfig({
  roleDefinitions,
  gameMode,
  disabled,
  categoryOrder,
  categoryLabels,
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
      categoryOrder={categoryOrder}
      categoryLabels={categoryLabels}
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
  categoryOrder?: string[];
  categoryLabels?: Record<string, string>;
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
  categoryOrder,
  categoryLabels,
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
          categoryOrder={categoryOrder}
          categoryLabels={categoryLabels}
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
  categoryOrder?: string[];
  categoryLabels?: Record<string, string>;
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
  categoryOrder,
  categoryLabels,
  onRemove,
  onSetName,
  onSetPlayerCount,
  onAddRole,
  onRemoveRole,
  onSetBucketUnique,
}: BucketEditorProps) {
  const assignedRoleIds = new Set(bucket.roles.map((r) => r.roleId));

  const roleDefById = new Map(allRoles.map((r) => [r.id, r]));
  const nonUniqueSlots = bucket.roles.filter(
    (slot) => !roleDefById.get(slot.roleId)?.unique,
  );
  const hasNonUniqueRoles = nonUniqueSlots.length > 0;
  const bucketIsUnique =
    hasNonUniqueRoles && nonUniqueSlots.every((s) => s.max === 1);

  const maxCapacity =
    bucket.roles.length > 0 ? getAdvancedBucketMaxCapacity(bucket) : undefined;
  const feasibilityError =
    maxCapacity !== undefined && maxCapacity < bucket.playerCount
      ? ROLE_BUCKET_CONFIG_COPY.errorInsufficientCapacity(
          maxCapacity,
          bucket.playerCount,
        )
      : undefined;

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
            const roleDef = roleDefById.get(slot.roleId);
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

      {feasibilityError && (
        <p className="text-xs text-destructive" role="alert" aria-live="polite">
          {feasibilityError}
        </p>
      )}

      <RoleBucketAddDialog
        allRoles={allRoles}
        gameMode={gameMode}
        assignedRoleIds={assignedRoleIds}
        disabled={disabled}
        categoryOrder={categoryOrder}
        categoryLabels={categoryLabels}
        onAddRole={(roleId) => {
          onAddRole(roleId, bucketIsUnique);
        }}
      />
    </div>
  );
}
