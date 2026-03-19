"use client";

import { UNSUPPORTED_GAME_MODE_COPY } from "./UnsupportedGameMode.copy";

export function UnsupportedGameMode() {
  return (
    <p className="p-5 text-muted-foreground">
      {UNSUPPORTED_GAME_MODE_COPY.message}
    </p>
  );
}
