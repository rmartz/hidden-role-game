import js from "@eslint/js";
// ⚠️ UNSUPPORTED ESLint internal API. See the maxLinesWarn note below — this
// repository is the intentional canary for #789, deliberately depending on this
// entry point so its removal breaks CI here first.
import { builtinRules } from "eslint/use-at-your-own-risk";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import storybook from "eslint-plugin-storybook";
import globals from "globals";
import tseslint from "typescript-eslint";

// ⚠️ UNSUPPORTED — see #789. Two-tier max-lines (a soft `warn` nudge below the
// hard `error` cap) cannot be expressed with one rule natively: a rule takes a
// single severity, and a duplicate `max-lines` key in one `rules` object
// silently collapses to the last. Aliasing the built-in rule under a second
// plugin namespace (`max-lines-warn/max-lines`) lets us register it twice at
// two severities. This repo is the ONLY one doing this, on purpose: if a future
// ESLint drops or changes `eslint/use-at-your-own-risk`, `pnpm lint` fails to
// load this config and CI breaks here first — an early nudge to check whether
// ESLint has landed native per-rule multi-threshold support and migrate off it.
const maxLinesWarn = { rules: { "max-lines": builtinRules.get("max-lines") } };

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
  // Vertical boundaries — seal each game mode's *logic internals*. A mode's
  // `utils/` and `actions/` are its implementation; code outside the mode
  // (components, app routes, server, the firebase/store layers) must not reach
  // into them. Everything the outside legitimately consumes — a mode's `copy`,
  // `roles`, `types`, `player-state`, `*-config`, `themes`, `constants` — is its
  // public data surface and is expressed by re-exporting through those public
  // modules (or the mode barrel), so a logic refactor stays inside the mode.
  //
  // Scoped to `utils/` + `actions/` deliberately: forcing the pervasive data
  // imports through a single mega-barrel would be a 300-site rewrite with no
  // real safety gain (tracked separately). A path-based `no-restricted-imports`
  // (stable core rule) is used because eslint-plugin-boundaries' matching
  // `entry-point` rule is deprecated in v7, and this repo avoids new
  // deprecated-API dependencies (see the #789 canary). Mode files are exempt so
  // a mode importing its *own* internals by absolute path is unaffected;
  // cross-mode internal imports are currently zero.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/game/modes/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/lib/game/modes/*/utils",
                "@/lib/game/modes/*/utils/**",
                "@/lib/game/modes/*/actions",
                "@/lib/game/modes/*/actions/**",
              ],
              message:
                "Don't import a game mode's utils/ or actions/ internals from outside the mode — re-export what you need through the mode's public surface (its barrel, types, or constants).",
            },
          ],
        },
      ],
    },
  },
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
  // File-length cap, two tiers (was the file-length.yml CI job). The hard
  // `error` cap fails `pnpm lint` / CI; the soft `warn` tier below it is
  // advisory — it surfaces in the editor and CI logs but does NOT fail the
  // build, which is why `pnpm lint` dropped `--max-warnings 0`. Warn ≈ the
  // AGENTS.md "split at" target, error = the hard cap. Source: warn 240 /
  // error 400. The warn tier uses the aliased built-in rule — see maxLinesWarn
  // above and #789 (this repo is the canary for that unsupported API).
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "max-lines-warn": maxLinesWarn },
    rules: {
      "max-lines-warn/max-lines": [
        "warn",
        { max: 240, skipBlankLines: false, skipComments: false },
      ],
      "max-lines": [
        "error",
        { max: 400, skipBlankLines: false, skipComments: false },
      ],
    },
  },
  // Test files (and shared fixtures under a `*-tests/` dir) get the higher
  // thresholds: warn 360 / error 600. Listed after the base block so it wins
  // for these files (last match wins).
  {
    files: [
      "**/*.spec.{ts,tsx}",
      "**/*.test.{ts,tsx}",
      "**/*-tests/**/*.{ts,tsx}",
    ],
    plugins: { "max-lines-warn": maxLinesWarn },
    rules: {
      "max-lines-warn/max-lines": [
        "warn",
        { max: 360, skipBlankLines: false, skipComments: false },
      ],
      "max-lines": [
        "error",
        { max: 600, skipBlankLines: false, skipComments: false },
      ],
    },
  },
);
