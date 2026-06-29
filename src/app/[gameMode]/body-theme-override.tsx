"use client";

import { useEffect } from "react";

interface BodyThemeOverrideProps {
  theme: string;
}

export function BodyThemeOverride({ theme }: BodyThemeOverrideProps) {
  useEffect(() => {
    const previousTheme = document.body.getAttribute("data-theme");
    return () => {
      if (previousTheme === null) {
        document.body.removeAttribute("data-theme");
      } else {
        document.body.setAttribute("data-theme", previousTheme);
      }
    };
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  return null;
}
