"use client";

import type { GameMode, RoleDefinition, Team } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RoleLabel } from "@/components/RoleLabel";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

interface RoleGlossaryDialogProps {
  roles: RoleDefinition<string, Team>[];
  gameMode?: GameMode;
  title: string;
  triggerLabel: string;
  categoryOrder?: string[];
  categoryLabels?: Record<string, string>;
}

export function RoleGlossaryDialog({
  roles,
  gameMode,
  title,
  triggerLabel,
  categoryOrder,
  categoryLabels,
}: RoleGlossaryDialogProps) {
  const glossaryRoles = roles.filter((r) => r.summary ?? r.description);
  if (glossaryRoles.length === 0) return null;

  const hasCategoryGrouping = !!categoryOrder;

  const groupedCategories = hasCategoryGrouping
    ? categoryOrder.reduce<
        {
          category: string;
          label: string;
          roles: RoleDefinition<string, Team>[];
        }[]
      >((acc, cat) => {
        const catRoles = glossaryRoles.filter((r) => r.category === cat);
        if (catRoles.length > 0) {
          acc.push({
            category: cat,
            label: categoryLabels?.[cat] ?? cat,
            roles: catRoles,
          });
        }
        return acc;
      }, [])
    : [];

  const uncategorized = hasCategoryGrouping
    ? glossaryRoles.filter(
        (r) => !r.category || !categoryOrder.includes(r.category),
      )
    : glossaryRoles;

  const renderRoleItems = (roleList: RoleDefinition<string, Team>[]) =>
    roleList.map((role) => (
      <AccordionItem key={role.id} value={role.id}>
        <AccordionTrigger>
          <span className="flex flex-wrap items-center gap-x-2">
            <RoleLabel role={role} gameMode={gameMode} />
            {role.summary && (
              <span className="font-normal text-muted-foreground">
                — {role.summary}
              </span>
            )}
          </span>
        </AccordionTrigger>
        <AccordionContent>{role.description ?? role.summary}</AccordionContent>
      </AccordionItem>
    ));

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {hasCategoryGrouping ? (
          <>
            {groupedCategories.map(({ category, label, roles: catRoles }) => (
              <div key={category}>
                <p className="text-xs font-semibold text-muted-foreground mt-4 mb-1">
                  {label}
                </p>
                <Accordion>{renderRoleItems(catRoles)}</Accordion>
              </div>
            ))}
            {uncategorized.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mt-4 mb-1">
                  {WEREWOLF_COPY.glossary.otherCategoryLabel}
                </p>
                <Accordion>{renderRoleItems(uncategorized)}</Accordion>
              </div>
            )}
          </>
        ) : (
          <Accordion>{renderRoleItems(glossaryRoles)}</Accordion>
        )}
      </DialogContent>
    </Dialog>
  );
}
