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

interface RoleGlossaryDialogProps {
  roles: RoleDefinition<string, Team>[];
  gameMode?: GameMode;
  title: string;
  triggerLabel: string;
}

export function RoleGlossaryDialog({
  roles,
  gameMode,
  title,
  triggerLabel,
}: RoleGlossaryDialogProps) {
  const glossaryRoles = roles.filter((r) => r.summary ?? r.description);
  if (glossaryRoles.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Accordion>
          {glossaryRoles.map((role) => (
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
              <AccordionContent>
                {role.description ?? role.summary}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}
