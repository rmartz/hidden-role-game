import React from "react";
import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";

const THEME_ITEMS = [
  { value: "twilight_modern", title: "Twilight Modern" },
  { value: "avalon", title: "Avalon" },
  { value: "clocktower", title: "Clocktower" },
  { value: "codenames", title: "Codenames" },
  { value: "secret_villain", title: "Secret Villain" },
  { value: "shadowplay", title: "Shadowplay" },
  { value: "werewolf", title: "Werewolf" },
] as const;

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Game-mode CSS theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: THEME_ITEMS,
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "twilight_modern",
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals["theme"] as string) ?? "twilight_modern";
      return React.createElement(
        "div",
        { "data-theme": theme },
        React.createElement(Story),
      );
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "error",
    },
  },
};

export default preview;
