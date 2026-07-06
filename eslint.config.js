import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import storybook from "eslint-plugin-storybook";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/next-env.d.ts",
      ".storybook/**",
      ".claude/**",
      "storybook-static/**",
      "vitest.config.mts",
      "src/components/ui/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "*.{ts,tsx}"],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["src/**/*.{ts,tsx}", "*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  // Test files use Response.json() which inherently returns `any`; relax unsafe rules
  {
    files: ["src/**/*.spec.ts", "src/**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  // CI scripts under .github/ run in Node.js; register node globals so `process`
  // and `console` are recognised without typed linting (scripts are not in the
  // app tsconfig project).
  {
    files: [".github/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // Storybook stories use loose patterns; skip strict type checking
  {
    files: ["src/**/*.stories.tsx"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  },
  ...storybook.configs["flat/recommended"],
  {
    files: ["**/*.{ts,tsx,js,mjs,cjs}"],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  // File-length hard cap (was the file-length.yml CI job + check-file-length.sh).
  // Enforced in-editor and via `pnpm lint`. Source 400, tests 600 (2x the
  // recommended ~200/~300 split-at target in AGENTS.md). A single-tier hard cap:
  // a soft warn tier is tracked in #789 for when ESLint supports two thresholds
  // per rule natively.
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "max-lines": [
        "error",
        { max: 400, skipBlankLines: false, skipComments: false },
      ],
    },
  },
  // Test files (and shared fixtures under a `*-tests/` dir) get the higher cap.
  // Listed after the base block so it wins for these files (last match wins).
  {
    files: [
      "**/*.spec.{ts,tsx}",
      "**/*.test.{ts,tsx}",
      "**/*-tests/**/*.{ts,tsx}",
    ],
    rules: {
      "max-lines": [
        "error",
        { max: 600, skipBlankLines: false, skipComments: false },
      ],
    },
  },
);
