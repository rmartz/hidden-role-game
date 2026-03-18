"use client";

import type { PlayerGameState } from "@/server/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { JsonTree } from "./JsonTree";
import { DEBUG_COPY } from "./copy";

interface DebugGameStateButtonProps {
  gameState: PlayerGameState;
}

export function DebugGameStateButton({ gameState }: DebugGameStateButtonProps) {
  if (process.env["NEXT_PUBLIC_DEBUG_MODE"] !== "true") return null;

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {DEBUG_COPY.buttonLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] w-full sm:max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{DEBUG_COPY.dialogTitle}</DialogTitle>
        </DialogHeader>
        <JsonTree data={gameState} />
      </DialogContent>
    </Dialog>
  );
}
