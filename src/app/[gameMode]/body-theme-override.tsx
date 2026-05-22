"use client";

import { useEffect } from "react";

interface BodyThemeOverrideProps {
  theme: string;
}

export function BodyThemeOverride({ theme }: BodyThemeOverrideProps) {
  useEffect(() => {
    const previousTheme = document.body.getAttribute("data-theme");
    document.body.setAttribute("data-theme", theme);

    return () => {
      if (previousTheme === null) {
        document.body.removeAttribute("data-theme");
        return;
      }

      document.body.setAttribute("data-theme", previousTheme);
    };
  }, [theme]);

  return null;
}
