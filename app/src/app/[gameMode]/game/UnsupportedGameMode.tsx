"use client";

import { GAME_PAGE_COPY } from "./copy";

export function UnsupportedGameMode() {
  return (
    <p className="p-5 text-muted-foreground">
      {GAME_PAGE_COPY.unsupportedGameMode}
    </p>
  );
}
