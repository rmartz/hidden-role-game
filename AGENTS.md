# Code Standards

## Package Manager

- Always use `pnpm`. Never `npm` or `yarn`.

## Common Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # Lint
pnpm format           # Format
pnpm test             # Run tests with Vitest
pnpm tsc              # Type check
pnpm storybook        # Start Storybook dev server (port 6006)
pnpm build-storybook  # Build static Storybook
```

## Firebase Compatibility

- **No backward-compatibility guards for Firebase data.** This project is not public-facing; breaking in-progress games on deploy is acceptable. Do not add migration guards, legacy-value fallbacks, or `"aye" | "yes"` dual-handling for renamed serialized values. Write code against the current schema only.

## TypeScript

- Strict mode throughout. No `any` types. No `@ts-ignore`.
- Do not use `null` unless required for API compatibility or when explicitly distinguishing `null` from `undefined`. Prefer `undefined` for absent/optional values throughout the codebase.
- Prefer explicit `interface` names scoped to their component (e.g., `interface OwnerAdvanceCardProps` not `interface Props`).
- Use `async/await`, not `.then()` chains.

## File Organization

- **Source files**: Keep under ~200 lines (split at ~240). Large files should be split by logical concern.
- **Test files**: Keep under ~300 lines (split at ~360). Use `.spec.ts` / `.spec.tsx` extension (not `.test.ts`). When splitting, organize into a `{module}-tests/` directory with domain-specific files (e.g., `resolution-tests/altruist.spec.ts`).
- **Components**: A component file contains its primary component and props interface. A sub-component may be co-located in the same file if it owns no hooks, state, effects, or context, and is used only by the parent component in that file — e.g., a context wrapper, structural template, or props alias. A sub-component must be in its own file when any of these are true: it owns hooks, state, effects, or context; it is referenced from multiple parents; or it is substantial enough to warrant its own stories or tests (e.g., list items, row components, panels, form sections). All component props must be defined as an explicitly named interface (e.g., `interface PlayerListProps`), never inline in the function signature.
- **Type files**: Convert large type files into barrel-exported directories with one file per logical domain (e.g., `lobby.ts`, `game.ts`, `player.ts`).
- Add a barrel `index.ts` when a component or module directory exposes a public API or already follows a barrel pattern; do not require one for every directory (e.g. ShadCN-generated `src/components/ui/` has no barrel by convention).
- Use named exports, not default exports (except for Next.js pages, Redux slices, and Storybook story files, which require `export default meta`).

## Code Conventions

- **Favor type inference.** Explicit generic type arguments (for example, `someFn<Foo>(...)`) are a code smell when TypeScript can infer them.
- **No spurious variables.** Do not assign a value to a variable only to immediately return it on the next line — return the expression directly instead.
- **No IIFEs.** Do not use immediately-invoked function expressions. Extract the logic into a named helper function or compute the value with a plain expression instead.
- **No function-style imports.** Do not use inline `import("…").Type` syntax in type annotations. Use module-level `import type { … } from "…"` statements at the top of the file. Dynamic `await import("…")` for services that require conditional loading (e.g., Sentry instrumentation) is acceptable.
- **No unnecessary helpers.** Do not extract logic into a helper function unless it separates significant logic or belongs in a different module. Three similar lines is better than a premature abstraction.
- **Role enums and definitions** in game mode files (e.g., `WerewolfRole` enum and `WEREWOLF_ROLES` object) must be kept in alphabetical order to minimize merge conflicts.
- **Prefer enums over string literal unions** for any domain concept with two or more named states (e.g., use `enum TrialPhase { Defense = "defense", Voting = "voting" }` rather than `"defense" | "voting"`). String enum values must match the current serialized schema (keep code and literals in sync); do not add compatibility shims for old serialized values. Export new enums from the module barrel.

## User-Facing Text

- For any new or modified UI component, store user-facing strings in a co-located copy file (e.g., `ComponentName.copy.ts` or `copy.ts`) for internationalization (i18n) readiness. Do not introduce new hardcoded display strings inline in components you are actively changing.

  Existing hardcoded strings elsewhere in the codebase are technical debt to be migrated over time; this rule does not require unrelated cleanup.
- Copy files export a single `as const` object named `{SCOPE}_COPY` (e.g., `WEREWOLF_COPY`, `HOME_PAGE_COPY`, `GAME_TIMER_COPY`).

## Documentation

- When adding or modifying roles, actions, game settings, or data flow in a game mode, update the corresponding docs in `docs/<game-mode>/` (`roles.md`, `actions.md`, `data-flow.md`).

## React / Next.js Standards

### Framework

- Next.js with App Router (not Pages Router).
- UI components: ShadCN UI. Do not install other component libraries.
- Styling: Tailwind CSS (comes with ShadCN). No CSS modules or styled-components.

### Client Components

- `"use client"` directive required on all React client components (Next.js App Router).
- React hooks must be called unconditionally — hooks before any early returns.

### JSX

- **No imperative logic inside JSX.** Imperative logic means anything that requires a statement rather than an expression: `const`/`let` declarations, `if`/`switch` blocks, loops, or any sequence of statements that produces a result through side effects. All such logic must live in the component body before the `return` statement, or be extracted into a child component. Expressions of any complexity are permitted directly in JSX — ternaries, logical operators (`&&`, `||`, `??`), method chains (`.map()`, `.filter()`, `.find()`), nested function calls, and template literals are all fine as long as they form a single expression with no intermediate bindings. Statement blocks inside callback functions passed as JSX props are allowed (e.g. multi-statement event handlers like `onChange={(e) => { setValue(e.target.value); setError(undefined); }}`).

### Component Structure

- Components should have a single JSX return statement. Invalid states should be prevented by the type system or guarded against by the calling component. An early `return null` can be acceptable if the invalid state is infeasible for the parent component to detect, but the component itself should be returned as a single JSX block.

## Naming Conventions

- **Game actions**: Export as `{actionName}Action` with type `GameAction` (e.g., `castVoteAction`, `startNightAction`).
- **Firebase schema conversions**: `{domain}ToFirebase()` / `firebaseTo{Domain}()` (e.g., `gameToFirebase()`, `firebaseToGame()`).
- **Redux slices**: File suffix `-slice.ts` (e.g., `game-config-slice.ts`).
- **Presentational views**: Components extracted for testability use the `{Component}View` suffix (e.g., `GameOverScreenView`, `ConfirmTargetButtonView`).

## Testing Conventions

- Use `describe`/`it` from Vitest (not `test`).
- Test fixture generators use `make{DomainName}()` (e.g., `makePlayingGame()`, `makeGameState()`).
- When splitting large test files, organize into `{module}-tests/` directories (e.g., `resolution-tests/altruist.spec.ts`).

### Test Design

- **Control inputs and outputs.** Do not rely on a function's default return values as the assertion of a test unless the purpose of the test is specifically to verify those defaults. Use explicit, non-default values so a passing test proves the value was produced by logic, not inherited from an initializer.
- **One reason to fail per test.** Each test should assert a single logical outcome. Helper functions are fine, but if a test invokes two functions from the codebase it should be explicitly testing how those two interact (e.g. validating a serialization round-trip). Incidental coverage of a second function is not a reason to combine assertions.
- **Keep tests simple.** A failing test should make it immediately obvious whether the failure is a bug or an intentional change in behavior. If understanding a failure requires reading more than one layer of test setup or multiple assertions, split the test.
- **Granularity scales with level of abstraction.** Low-level functions (pure utilities, serializers, resolvers) warrant thorough edge-case coverage. High-level functions (actions, service orchestration) should have smoke tests that verify they correctly apply the lower-level logic — not re-test every edge case that belongs in the lower-level tests.

## GitHub Issues

- Each Epic has a corresponding GitHub Milestone with the same title. All sub-issues must be assigned to that milestone; progress is tracked natively via the milestone.
- Every sub-issue under a game-mode Epic must carry the same game-mode label as the Epic (e.g. `Werewolf`, `Avalon`, `Clocktower`, `Codenames`). Labels persist across epics for the same mode; milestones are per-epic deliverable.
- When picking the next task from an Epic, use `gh issue list --milestone "<milestone title>" --state open`.

## Git Conventions

- Branch names: lowercase with hyphens, prefixed by type: `feature/`, `chore/`, `refactor/`, `docs/`, with issue number suffix (e.g., `feature/secret-villain-deck-290`).
- Commit messages: imperative verbs (Add, Implement, Fix, Update, Extract, Remove). No `feat:`/`fix:` prefixes.
- PR titles must follow Conventional Commits format: `<type>: description` or `<type>(<scope>): description`. This Conventional Commits requirement applies to PR titles only; commit messages remain imperative and should not use `feat:`/`fix:` prefixes. Valid types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`, `ci`, `build`, `revert`. A `!` suffix is allowed before the colon to denote breaking changes (e.g., `feat!: remove legacy auth`). This is enforced by CI.
- PR descriptions must use `Closes #123`, `Fixes #123`, or `Resolves #123` to trigger GitHub's automatic issue close on merge. Phrases like "Addresses #123" or "Related to #123" do NOT trigger auto-close.

## Storybook

- Story files are co-located with their component: `ComponentName.stories.tsx`.
- When adding or modifying a UI component, add or update its Storybook story to cover key visual states.
- Stories should use mock data fixtures — never import from Firebase or depend on runtime providers (QueryClient, Redux store, Next.js router).
- Components that are too hook-dependent to render in isolation should use a presentational split: extract rendering into a `ComponentNameView` that accepts callbacks, and keep the original as a thin wrapper that wires up hooks.

## Component Tests

- Test files are co-located with their component: `ComponentName.spec.tsx`.
- When adding or modifying a UI component, add or update its test to verify rendering behavior and key prop-driven states.
- Use `@testing-library/react` with `vitest`. Always call `afterEach(cleanup)`.
- Do not use `.toBeInTheDocument()` — use `.toBeDefined()` or check `.textContent` instead.
- Assert against copy constants (e.g., `WEREWOLF_COPY`) rather than hardcoded strings.
- Test presentational view components directly; avoid mocking hooks in tests where possible.
