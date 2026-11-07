import { createRequire } from "node:module";

import babel from "@rolldown/plugin-babel";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import { reactCompilerPreset } from "@vitejs/plugin-react";

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
  ],
  framework: "@storybook/nextjs-vite",
  // Render stories through the same React Compiler transform as the Next.js
  // build. It must run first: the compiler only recognizes components while
  // they still contain JSX, before the framework's SWC plugin lowers it.
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: [
      babel({ presets: [reactCompilerPreset()] }),
      ...(viteConfig.plugins ?? []),
      // The framework swaps `react` for Next's bundled copy but has no entry for
      // `react/compiler-runtime`: under Vitest its `react` prefix alias rewrites
      // it to a path that doesn't exist, and elsewhere it would load a second
      // React. Point it at Next's copy. This must come from a `config` hook:
      // Vite gives hook-returned aliases precedence over the base config's.
      {
        name: "react-compiler-runtime-alias",
        config: () => ({
          resolve: {
            alias: [
              {
                find: /^react\/compiler-runtime$/,
                replacement:
                  require.resolve("next/dist/compiled/react/compiler-runtime"),
              },
            ],
          },
        }),
      },
    ],
  }),
};
export default config;
