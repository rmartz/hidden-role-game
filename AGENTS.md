# Code Standards

## File Size

- Keep files under ~200 lines. Large files should be split by logical concern.
- **Components**: Delegate complex logic to utility functions or sub-components. Each component file should have a single clear responsibility.
- **Type files**: Convert large type files into barrel-exported directories with one file per logical domain (e.g., `lobby.ts`, `game.ts`, `player.ts`).
- **Utility files**: Split by the type of operation or domain they serve.
- **Service files**: Extract complex logic areas into focused utility functions or smaller services.
- **Test files**: When the primary file is split, create a corresponding test file for each split portion.

## JSX / Components

- **No imperative logic inside JSX.** All imperative or conditional logic must be computed in the component body before the `return` statement, or extracted into a dedicated child component.
- JSX should only contain simple functional expressions: `items.map(item => <Item key={item.id} {...item} />)`.

## User-Facing Text

- All user-facing strings must be stored in a constants/copy file (e.g., `copy.ts`) for internationalization (i18n) readiness.
- Do not hardcode display strings inline in components.

## TypeScript

- Strict mode throughout. No `any` types.
- Do not use `null` unless required for API compatibility or when explicitly distinguishing `null` from `undefined`. Prefer `undefined` for absent/optional values throughout the codebase.
- Prefer explicit `interface` names scoped to their component (e.g., `interface OwnerAdvanceCardProps` not `interface Props`).

## React / Next.js

- `"use client"` directive required on all React client components (Next.js App Router).
- React hooks must be called unconditionally — hooks before any early returns.
- Components should have a single JSX return statement. Invalid states should be prevented by the type system or guarded against by the calling component. An early `return null` can be acceptable if the invalid state is infeasible for the parent component to detect, but the component itself should be returned as a single JSX block.
- Barrel `index.ts` exports for all component/module directories.

## Package Manager

- Always use `pnpm`. Never `npm` or `yarn`.
