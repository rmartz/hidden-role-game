import type { ReactNode } from "react";

interface LobbyLayoutProps {
  children: ReactNode;
}

export function LobbyLayout({ children }: LobbyLayoutProps) {
  return (
    <div
      data-testid="lobby-layout"
      className="p-5 mx-auto w-full max-w-screen-md md:max-w-6xl"
    >
      {children}
    </div>
  );
}
