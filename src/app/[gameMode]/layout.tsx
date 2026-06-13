import type { ReactNode } from "react";

import { HomeLink } from "@/components/HomeLink";
import { parseGameMode } from "@/lib/game/modes";
import { resolveGameModeTheme } from "@/lib/game/theme";

import { ThemeProvider } from "./ThemeProvider";

interface GameModeLayoutProps {
  children: ReactNode;
  params: Promise<{ gameMode: string }>;
}

export default async function GameModeLayout({
  children,
  params,
}: GameModeLayoutProps) {
  const { gameMode: gameModeParam } = await params;
  const gameMode = parseGameMode(gameModeParam);
  const theme = resolveGameModeTheme(gameMode);

  return (
    <ThemeProvider theme={theme}>
      <nav className="px-4 pt-3 pb-1">
        <HomeLink />
      </nav>
      {children}
    </ThemeProvider>
  );
}
