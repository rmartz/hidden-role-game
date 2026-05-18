"use client";

import { useMemo, useState } from "react";

import { RoleLabel } from "@/components/RoleLabel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { GameMode, RoleDefinition, Team } from "@/lib/types";

import { ROLE_BUCKET_ADD_DIALOG_COPY } from "./RoleBucketAddDialog.copy";

interface RoleBucketAddDialogProps {
  allRoles: RoleDefinition<string, Team>[];
  gameMode: GameMode;
  assignedRoleIds: Set<string>;
  disabled: boolean;
  onAddRole: (roleId: string) => void;
  categoryOrder?: string[];
  categoryLabels?: Record<string, string>;
}

interface RoleBucketAddDialogViewProps {
  open: boolean;
  gameMode: GameMode;
  disabled: boolean;
  onOpenChange: (open: boolean) => void;
  categorizedRoles: {
    category: string;
    label: string;
    roles: RoleDefinition<string, Team>[];
  }[];
  uncategorizedRoles: RoleDefinition<string, Team>[];
  hasCategoryGrouping: boolean;
  assignedRoleIds: Set<string>;
  onAddRole: (roleId: string) => void;
}

export function RoleBucketAddDialog({
  allRoles,
  gameMode,
  assignedRoleIds,
  disabled,
  onAddRole,
  categoryOrder,
  categoryLabels,
}: RoleBucketAddDialogProps) {
  const [open, setOpen] = useState(false);
  const hasCategoryGrouping = !!categoryOrder && categoryOrder.length > 0;

  const categorizedRoles = useMemo(() => {
    if (!hasCategoryGrouping) {
      return [];
    }

    return categoryOrder.reduce<
      {
        category: string;
        label: string;
        roles: RoleDefinition<string, Team>[];
      }[]
    >((acc, category) => {
      const roles = allRoles.filter((role) => role.category === category);
      if (roles.length > 0) {
        acc.push({
          category,
          label: categoryLabels?.[category] ?? category,
          roles,
        });
      }
      return acc;
    }, []);
  }, [allRoles, categoryLabels, categoryOrder, hasCategoryGrouping]);

  const uncategorizedRoles = useMemo(() => {
    if (!hasCategoryGrouping) {
      return allRoles;
    }

    return allRoles.filter(
      (role) => !role.category || !categoryOrder.includes(role.category),
    );
  }, [allRoles, categoryOrder, hasCategoryGrouping]);

  function handleAddRole(roleId: string) {
    onAddRole(roleId);
    setOpen(false);
  }

  return (
    <RoleBucketAddDialogView
      open={open}
      gameMode={gameMode}
      disabled={disabled}
      onOpenChange={setOpen}
      categorizedRoles={categorizedRoles}
      uncategorizedRoles={uncategorizedRoles}
      hasCategoryGrouping={hasCategoryGrouping}
      assignedRoleIds={assignedRoleIds}
      onAddRole={handleAddRole}
    />
  );
}

export function RoleBucketAddDialogView({
  open,
  gameMode,
  disabled,
  onOpenChange,
  categorizedRoles,
  uncategorizedRoles,
  hasCategoryGrouping,
  assignedRoleIds,
  onAddRole,
}: RoleBucketAddDialogViewProps) {
  function renderRole(role: RoleDefinition<string, Team>) {
    const isAdded = assignedRoleIds.has(role.id);

    return (
      <li
        key={role.id}
        className="grid grid-cols-[1fr_auto] items-start gap-3 rounded-md border p-2"
      >
        <div className="space-y-1">
          <RoleLabel role={role} gameMode={gameMode} />
          <p className="text-xs text-muted-foreground">
            {role.description ??
              role.summary ??
              ROLE_BUCKET_ADD_DIALOG_COPY.descriptionFallback}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || isAdded}
          onClick={() => {
            onAddRole(role.id);
          }}
        >
          {isAdded
            ? ROLE_BUCKET_ADD_DIALOG_COPY.added
            : ROLE_BUCKET_ADD_DIALOG_COPY.addRoleButton}
        </Button>
      </li>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        disabled={disabled}
        render={<Button variant="outline" size="sm" className="w-fit" />}
      >
        {ROLE_BUCKET_ADD_DIALOG_COPY.addRole}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{ROLE_BUCKET_ADD_DIALOG_COPY.title}</DialogTitle>
        </DialogHeader>
        {hasCategoryGrouping ? (
          <div className="space-y-4">
            {categorizedRoles.map(({ category, label, roles }) => (
              <div key={category} className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {label}
                </p>
                <ul className="space-y-2 list-none p-0">
                  {roles.map(renderRole)}
                </ul>
              </div>
            ))}
            {uncategorizedRoles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {ROLE_BUCKET_ADD_DIALOG_COPY.uncategorizedLabel}
                </p>
                <ul className="space-y-2 list-none p-0">
                  {uncategorizedRoles.map(renderRole)}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <ul className="space-y-2 list-none p-0">
            {uncategorizedRoles.map(renderRole)}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
