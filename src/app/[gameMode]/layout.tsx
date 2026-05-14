import type { ReactNode } from "react";

import { HomeLink } from "@/components/HomeLink";

interface GameModeLayoutProps {
  children: ReactNode;
}

export default function GameModeLayout({ children }: GameModeLayoutProps) {
  return (
    <div>
      <nav className="px-4 pt-3 pb-1">
        <HomeLink />
      </nav>
      {children}
    </div>
  );
}
