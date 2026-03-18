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

interface DebugGameStateButtonProps {
  gameState: PlayerGameState;
}

export function DebugGameStateButton({ gameState }: DebugGameStateButtonProps) {
  if (process.env["NEXT_PUBLIC_DEBUG_MODE"] !== "true") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Dialog>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          Debug
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] w-full sm:max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Game State</DialogTitle>
          </DialogHeader>
          <JsonTree data={gameState} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
