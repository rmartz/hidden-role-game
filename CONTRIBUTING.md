# Contributing

See `AGENTS.md` (root and `app/`) for the authoritative coding standards consumed by AI agents. This file provides the same rules in a more readable format with examples.

## Package Manager

Always use `pnpm`. Never `npm` or `yarn`.

## Common Commands

```bash
pnpm dev              # Start dev server (from app/)
pnpm build            # Production build (from app/)
pnpm lint             # Lint (from app/)
pnpm format           # Format (from app/)
pnpm test             # Run tests with Vitest (from app/ or root)
pnpm tsc --noEmit     # Type check (from app/)
```

---

## Code Style

### File size

Keep files under ~200 lines. When a file grows beyond that, split it by logical concern:

- **Components** — delegate complex logic to utility functions or sub-components. Each component file should have one clear responsibility.
- **Type files** — split into a barrel-exported directory with one file per domain (`lobby.ts`, `game.ts`, `player.ts`, etc.).
- **Utilities** — split by operation type or domain.
- **Services** — extract complex logic areas into focused utility functions or smaller services.
- **Tests** — when you split a file, create a corresponding test file for each part.

### TypeScript

- Strict mode throughout. No `any` types. No `@ts-ignore`.
- Use `async/await`, not `.then()` chains.
- Prefer `undefined` for absent or optional values. Only use `null` when required by an external API, or when you explicitly need to distinguish "intentionally empty" from "not yet set" — and document why.
- Name interfaces after their component or usage context: `interface OwnerAdvanceCardProps`, not `interface Props`.

### Exports

Use named exports, not default exports (except for Next.js pages and Redux slices).

### No spurious variables

Do not assign a value to a variable only to immediately return it on the next line — return the expression directly instead.

### User-facing text

All strings shown to the user must live in a co-located copy file (`ComponentName.copy.ts` or `copy.ts`) — not inline in components. This keeps the codebase i18n-ready and makes it easy to find and audit copy changes.

---

## React and Next.js

### Framework constraints

- Next.js with App Router (not Pages Router).
- UI components: ShadCN UI. Do not install other component libraries.
- Styling: Tailwind CSS (comes with ShadCN). No CSS modules or styled-components.

### Client components

Every React component that uses browser APIs, hooks, or interactivity must begin with `"use client"` (Next.js App Router requirement).

### Hook rules

Hooks must be called unconditionally — place all hook calls before any early returns or conditional logic.

### Single return

Components should have one JSX return statement. Rather than branching into multiple `return` blocks, compute conditional content in variables before the return:

```tsx
// Good — conditional content as a variable
const statusBadge = isOnline ? <OnlineBadge /> : <OfflineBadge />;
return <Card>{statusBadge}</Card>;

// Good — inline ternary when it's the whole return
return isLoading ? <Spinner /> : <Content data={data} />;

// Avoid — multiple return statements
if (isLoading) return <Spinner />;
return <Content data={data} />;
```

**Invalid states** should be prevented by the type system or guarded by the calling component before the child is instantiated. An early `return null` is acceptable when the component genuinely can't render and the parent has no way to know that — but keep it as the exception, not the rule.

### JSX logic

JSX should only contain simple expressions — primarily `array.map(...)` calls. Any conditional or imperative logic belongs in the component body above the return, or in a dedicated child component.

```tsx
// Good — logic above the return
const items = rawItems.filter((i) => i.isVisible);
return (
  <ul>
    {items.map((i) => (
      <Item key={i.id} {...i} />
    ))}
  </ul>
);

// Avoid — complex logic inline in JSX
return (
  <ul>
    {rawItems
      .filter((i) => i.isVisible)
      .map((i) => (
        <Item key={i.id} {...i} />
      ))}
  </ul>
);
```

### Barrel exports

Every component or module directory should have an `index.ts` that re-exports its public surface. Consumers import from the directory, not individual files.
