"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

interface ThemeProviderProps {
  children: ReactNode;
  theme: string;
}

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
    return () => {
      delete document.documentElement.dataset["theme"];
    };
  }, [theme]);

  return <>{children}</>;
}
