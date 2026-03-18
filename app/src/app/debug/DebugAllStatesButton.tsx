"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JsonTree } from "@/components/debug";
import { useAllPlayersGameStates, useDebugFullGameState } from "@/hooks";
import type { GameMode } from "@/lib/types";
import type { DebugPlayer } from "@/app/api/debug/game/route";
import { DEBUG_VIEW_COPY } from "./copy";

const SERVER_TAB = "server";

interface DebugAllStatesButtonProps {
  gameId: string;
  gameMode: GameMode;
  players: DebugPlayer[];
}

export function DebugAllStatesButton(props: DebugAllStatesButtonProps) {
  if (process.env["NEXT_PUBLIC_DEBUG_MODE"] !== "true") return null;
  return <DebugAllStatesButtonContent {...props} />;
}

function DebugAllStatesButtonContent({
  gameId,
  gameMode,
  players,
}: DebugAllStatesButtonProps) {
  const [open, setOpen] = useState(false);
  const states = useAllPlayersGameStates(gameId, gameMode, players, open);
  const { data: fullGameState } = useDebugFullGameState(gameId, open);
  const defaultTab = players[0]?.sessionId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {DEBUG_VIEW_COPY.buttonLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] w-full sm:max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{DEBUG_VIEW_COPY.dialogTitle}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger value={SERVER_TAB}>
              {DEBUG_VIEW_COPY.serverTabLabel}
            </TabsTrigger>
            {players.map((player) => (
              <TabsTrigger key={player.sessionId} value={player.sessionId}>
                {player.name}
                {player.isOwner ? " (Owner)" : ""}
              </TabsTrigger>
            ))}
          </TabsList>
          {players.map((player) => {
            const state = states.get(player.sessionId);
            return (
              <TabsContent key={player.sessionId} value={player.sessionId}>
                {state ? (
                  <JsonTree data={state} />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {DEBUG_VIEW_COPY.loadingState}
                  </p>
                )}
              </TabsContent>
            );
          })}
          <TabsContent value={SERVER_TAB}>
            {fullGameState ? (
              <JsonTree data={fullGameState} />
            ) : (
              <p className="text-muted-foreground text-sm">
                {DEBUG_VIEW_COPY.loadingState}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
