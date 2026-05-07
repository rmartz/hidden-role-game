import { defineConfig } from "vitest/config";
import path from "path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

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
        test: {
          name: "hooks",
          environment: "happy-dom",
          include: ["src/hooks/**/*.spec.ts"],
        },
        resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
      },
      {
        test: {
          name: "components",
          environment: "happy-dom",
          include: ["src/**/*.spec.tsx"],
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
