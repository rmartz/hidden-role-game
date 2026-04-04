import { defineConfig } from "vitest/config";
import path from "path";

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
    ],
  },
});
