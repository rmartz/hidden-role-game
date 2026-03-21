# Code Standards

## Package Manager

- Always use `pnpm`. Never `npm` or `yarn`.

## Common Commands

```bash
pnpm dev              # Start dev server (from app/)
pnpm build            # Production build (from app/)
pnpm lint             # Lint (from app/)
pnpm format           # Format (from app/)
pnpm test             # Run tests with Vitest (from app/ or root)
pnpm tsc --noEmit     # Type check (from app/)
```

## TypeScript

- Strict mode throughout. No `any` types. No `@ts-ignore`.
- Do not use `null` unless required for API compatibility or when explicitly distinguishing `null` from `undefined`. Prefer `undefined` for absent/optional values throughout the codebase.
- Prefer explicit `interface` names scoped to their component (e.g., `interface OwnerAdvanceCardProps` not `interface Props`).
- Use `async/await`, not `.then()` chains.

## File Organization

- **Source files**: Keep under ~200 lines (split at ~240). Large files should be split by logical concern.
- **Test files**: Keep under ~300 lines (split at ~360). When splitting, organize into a `{module}-tests/` directory with domain-specific files (e.g., `resolution-tests/altruist.test.ts`).
- **Components**: Each component file must contain exactly one component and its associated props interface. Delegate complex logic to utility functions or sub-components.
- **Type files**: Convert large type files into barrel-exported directories with one file per logical domain (e.g., `lobby.ts`, `game.ts`, `player.ts`).
- **Utility files**: Split by the type of operation or domain they serve.
- **Service files**: Extract complex logic areas into focused utility functions or smaller services.
- Barrel `index.ts` exports for all component/module directories.
- Use named exports, not default exports (except for Next.js pages and Redux slices).

## Code Conventions

- **No spurious variables.** Do not assign a value to a variable only to immediately return it on the next line — return the expression directly instead.
- **Role enums and definitions** in game mode files (e.g., `WerewolfRole` enum and `WEREWOLF_ROLES` object) must be kept in alphabetical order to minimize merge conflicts.

## User-Facing Text

- All user-facing strings must be stored in a co-located copy file (e.g., `ComponentName.copy.ts` or `copy.ts`) for internationalization (i18n) readiness.
- Do not hardcode display strings inline in components.

## Documentation

- When adding or modifying roles, actions, game settings, or data flow in a game mode, update the corresponding docs in `docs/<game-mode>/` (`roles.md`, `actions.md`, `data-flow.md`).
- Keep documentation in sync with the code — outdated docs are worse than no docs.
