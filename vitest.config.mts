import { defineConfig } from "vitest/config";
import path from "path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import babel from "@rolldown/plugin-babel";
import { reactCompilerPreset } from "@vitejs/plugin-react";

// Run React code under test through the same React Compiler transform that
// `reactCompiler: true` applies in the Next.js build. @babel/core stays on 7.x:
// babel-plugin-react-compiler 1.0 bails on Babel 8's AST for destructured
// prop defaults, silently skipping those components (react/react#37406).
const reactCompiler = babel({ presets: [reactCompilerPreset()] });

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.spec.ts"],
          exclude: ["src/hooks/**/*.spec.ts"],
          setupFiles: ["src/test-setup/firebase-admin-mock.ts"],
        },
        resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
      },
      {
        plugins: [reactCompiler],
        test: {
          name: "hooks",
          environment: "happy-dom",
          include: ["src/hooks/**/*.spec.ts"],
          setupFiles: ["src/test-setup/base-ui-animations.ts"],
        },
        resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
      },
      {
        plugins: [reactCompiler],
        test: {
          name: "components",
          environment: "happy-dom",
          include: ["src/**/*.spec.tsx"],
          setupFiles: ["src/test-setup/base-ui-animations.ts"],
        },
        resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
      },
      {
        plugins: [storybookTest()],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
          setupFiles: ["@storybook/addon-vitest/internal/setup-file"],
        },
      },
    ],
  },
});
