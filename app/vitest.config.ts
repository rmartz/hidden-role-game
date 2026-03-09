import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
          exclude: ["src/hooks/**/*.test.ts"],
        },
        resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
      },
      {
        test: {
          name: "hooks",
          environment: "happy-dom",
          include: ["src/hooks/**/*.test.ts"],
        },
        resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
      },
    ],
  },
});
