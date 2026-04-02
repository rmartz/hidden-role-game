# Technical Architecture Reference

This document captures non-business-logic technical decisions, patterns, and infrastructure setup for building a Next.js application with Firebase, Vercel, and high test coverage.

## Stack

| Layer           | Technology                      | Purpose                                        |
| --------------- | ------------------------------- | ---------------------------------------------- |
| Framework       | Next.js (App Router)            | Fullstack React with SSR/API routes            |
| Language        | TypeScript (strict mode)        | Type safety throughout                         |
| Package Manager | pnpm                            | Fast, disk-efficient dependency management     |
| UI Components   | ShadCN UI + Tailwind CSS        | Composable, accessible component primitives    |
| State (server)  | TanStack Query                  | Server state caching, polling, invalidation    |
| State (client)  | Redux Toolkit                   | Local UI state (forms, config panels)          |
| Database        | Firebase Realtime Database      | Persistent storage with real-time push         |
| Auth            | Firebase Admin SDK (server)     | Session-based auth via API routes              |
| Hosting         | Vercel                          | Deployment, preview URLs, edge functions       |
| Testing         | Vitest + @testing-library/react | Unit, component, and integration tests         |
| Visual Testing  | Storybook 10                    | Component development and visual documentation |
| CI/CD           | GitHub Actions                  | Lint, format, test, build on every PR          |
| Monitoring      | Sentry                          | Error tracking (client + server + edge)        |

## Project Structure

```
project-root/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── page.tsx            # Home page
│   │   ├── [dynamic]/          # Dynamic route segments
│   │   └── api/                # API route handlers
│   ├── components/
│   │   ├── ui/                 # ShadCN UI primitives (auto-generated, excluded from lint/prettier)
│   │   ├── {feature}/          # Feature-specific components with co-located stories and tests
│   │   └── {shared}/           # Shared components
│   ├── lib/
│   │   ├── firebase/           # Firebase Admin + client SDK wrappers
│   │   │   ├── admin.ts        # Server-side Firebase Admin initialization
│   │   │   ├── client.ts       # Client-side Firebase SDK initialization
│   │   │   └── schema/         # TypeScript types and serialization helpers
│   │   ├── types/              # Core domain types (barrel-exported)
│   │   └── utils.ts            # Shared utility functions (e.g., cn() for Tailwind)
│   ├── server/
│   │   ├── types/              # API response types (public-facing)
│   │   └── utils/              # Server-only helpers (auth, validation)
│   ├── services/               # Data access layer (Firebase-backed)
│   ├── hooks/                  # Custom React hooks (barrel-exported)
│   ├── store/                  # Redux Toolkit slices
│   └── test-setup/             # Vitest setup files (mocks, globals)
├── .storybook/                 # Storybook configuration
├── .github/
│   ├── actions/setup/          # Composite action: pnpm + Node.js + install
│   └── workflows/              # CI workflows
├── docs/                       # Feature documentation
├── package.json
├── tsconfig.json
├── next.config.ts
├── vitest.config.mts
├── eslint.config.js            # Flat config with typescript-eslint + react-hooks + storybook
├── postcss.config.mjs
└── .prettierignore
```

## Firebase Architecture

### Packages

- `firebase` (client SDK) — real-time subscriptions via `onValue`
- `firebase-admin` (server SDK) — data mutations via API routes

### Initialization

Both SDKs are lazily initialized to avoid errors during static builds (CI has no env vars):

```typescript
// Client: src/lib/firebase/client.ts
function getClientApp() {
  return getApps().find((a) => a.name === "[DEFAULT]") ?? initializeApp(config);
}

// Server: src/lib/firebase/admin.ts
function initAdminApp() {
  const existing = getApps().find((a) => a.name === "[DEFAULT]");
  if (existing) return existing;
  return initializeApp({ credential: cert({...}), databaseURL: ... });
}
```

Firestore/RTDB instances are accessed via function calls (`getClientDatabase()`, `getAdminDatabase()`), never module-level constants.

### Database Schema Pattern

Separate public and private data at the path level:

```
/{collection}/{id}/public    # World-readable data (client SDK subscribes here)
/{collection}/{id}/private   # Server-only data (Admin SDK only)
```

### Serialization Layer

- TypeScript types define the domain model
- `{domain}ToFirebase()` converts domain objects to Firebase-safe format (no `undefined` values)
- `firebaseTo{Domain}()` converts Firebase snapshots back to domain objects with defaults
- Boolean settings are always written explicitly (not sparse) and deserialized with `?? false`

### Real-Time Updates

- Clients subscribe to Firebase RTDB paths via `onValue` (wrapped in custom hooks)
- Server pre-computes per-user state and writes it to per-user paths — clients never need to derive state
- TanStack Query caches Firebase data; mutations invalidate the cache

### Environment Variables

| Variable                 | Side   | Description                                                  |
| ------------------------ | ------ | ------------------------------------------------------------ |
| `FIREBASE_PROJECT_ID`    | Server | Firebase project ID                                          |
| `FIREBASE_CLIENT_EMAIL`  | Server | Service account email                                        |
| `FIREBASE_PRIVATE_KEY`   | Server | Service account key (literal `\n`)                           |
| `FIREBASE_DATABASE_URL`  | Server | RTDB URL                                                     |
| `NEXT_PUBLIC_FIREBASE_*` | Client | Client SDK config (API key, auth domain, project ID, DB URL) |

`NEXT_PUBLIC_` variables are bundled into client JavaScript — this is by design. Access control is enforced by Firebase security rules (RTDB rules or Firestore rules), not by hiding these keys.

## Vitest Configuration

Three test projects in `vitest.config.mts`:

```typescript
{
  test: {
    projects: [
      {
        // Unit tests (actions, services, utilities)
        test: { name: "node", environment: "node", include: ["src/**/*.test.ts"] },
      },
      {
        // Hook tests (require React context)
        test: { name: "hooks", environment: "happy-dom", include: ["src/hooks/**/*.test.ts"] },
      },
      {
        // Component tests (require DOM)
        test: { name: "components", environment: "happy-dom", include: ["src/**/*.test.tsx"] },
      },
    ],
  },
}
```

The file extension convention (`.test.ts` vs `.test.tsx`) determines which project runs each test. This keeps the split automatic — no manual tagging or directory-based routing needed.

### Test File Conventions

- Co-located with source: `Component.test.tsx`, `utility.test.ts`
- Component tests use `@testing-library/react` with `afterEach(cleanup)`
- No jest-dom matchers — use `.toBeDefined()` or `.textContent`
- Test fixtures use `make{Domain}()` factory functions
- Large test files split into `{module}-tests/` directories

## Storybook Configuration

### Setup

- Framework: `@storybook/nextjs-vite`
- Addons: `addon-a11y`, `addon-docs`, `eslint-plugin-storybook`
- Tailwind loaded via `globals.css` import in `.storybook/preview.ts`

### Conventions

- Stories co-located as `ComponentName.stories.tsx`
- Presentational split for hook-dependent components: `{Component}View` accepts callbacks
- Mock data fixtures — no Firebase, no providers
- ESLint: strict TS rules relaxed for `.stories.tsx`; `.storybook/` and `storybook-static/` ignored

### Future Evaluation

- Chromatic for visual regression testing (#332)
- `@storybook/addon-vitest` for story-based integration testing (#331)
- `@storybook/addon-onboarding` — interactive first-launch walkthrough. Low value for solo/small-team projects where conventions are documented in AGENTS.md. May be useful for projects with frequent new contributors who need to learn the story writing workflow.

## ESLint Configuration

Flat config (`eslint.config.js`) with:

- `typescript-eslint` strict + stylistic type-checked rules for `src/**/*.{ts,tsx}`
- `react-hooks` plugin (rules-of-hooks + exhaustive-deps as errors)
- `eslint-plugin-storybook` flat/recommended
- Relaxed rules for test files (`*.test.ts`) and story files (`*.stories.tsx`)
- Ignored: `dist/`, `node_modules/`, `.next/`, `storybook-static/`, `.storybook/`, `src/components/ui/`

## CI/CD Pipeline

### GitHub Actions

**Composite setup action** (`.github/actions/setup/action.yml`):

```yaml
- pnpm/action-setup (install pnpm)
- actions/setup-node (with cache: "pnpm")
- pnpm install --frozen-lockfile
```

**CI checks** (run on every PR):
| Job | Command | Purpose |
|---|---|---|
| Tests | `pnpm test` | Vitest across all projects |
| Lint | `pnpm lint` | ESLint with zero warnings |
| Format | `pnpm format:check` | Prettier check |
| Build | `pnpm build` | Next.js production build |

**Auto-format** (`workflow_run`): On CI format failure, auto-fix and push (Claude-authored PRs only).

**Dependabot lockfile regen** (`pull_request_target`): Regenerates `pnpm-lock.yaml` for Dependabot PRs using `CI_PAT_TOKEN` for proper check triggering.

**Claude Code** (`issue_comment`, `pull_request_review_comment`, `issues`): Optional — runs Claude Code action when `@claude` is mentioned in issues/PRs. Requires `ANTHROPIC_API_KEY` secret.

### Vercel

- Automatic preview deployments on every PR
- Production deployment on merge to main
- Root directory: project root (no subdirectory)

## Service Layer Pattern

### Separation of Concerns

```
API Route → Service (data access) → Firebase
                ↓
         GameModeServices (business logic per mode)
```

- **Services** (`FirebaseLobbyService`, `FirebaseGameService`): Pure data access — read/write Firebase. No game logic.
- **GameModeServices** (per game mode): Business logic — turn state initialization, player state extraction, win conditions.
- **GameModeConfig**: Registry object per game mode with roles, actions, and services. Dispatch through `config.services.*` — no game-mode imports in shared code.

### Service Conventions

- Service functions accept and return typed interfaces, never raw Firebase snapshots
- Timestamps converted to `Date` objects at the service boundary
- Each domain gets its own service file or directory
- Components never import Firebase directly — all data access goes through services or hooks

### GameModeServices Interface

```typescript
interface GameModeServices {
  buildInitialTurnState(roleAssignments, options?): unknown;
  selectSpecialTargets(roleAssignments): Record<string, string>;
  extractPlayerState(game, callerId, myRole?): Record<string, unknown>;
}
```

## State Management

### Server State (TanStack Query)

- Game state polled via `useQuery` with Firebase `onValue` for real-time push
- Mutations via `useMutation` → API routes → Firebase Admin SDK
- Cache invalidation on successful mutation

### Client State (Redux Toolkit)

- Used for local UI state only (lobby config form, game settings)
- Slices in `store/{feature}-slice.ts`
- Connected to components via `useAppSelector` / `useAppDispatch`

### Providers Pattern

A client boundary component wraps the app with all required providers:

```
Root Layout → Providers ("use client") → QueryClientProvider → AuthProvider/GameModeContext → Pages
```

`QueryClient` is created via `useState` inside the Providers component to avoid re-creation on re-renders.

### Real-Time Pattern

```
Firebase RTDB push → onValue callback → TanStack Query cache update → React re-render
```

No polling needed for subscribed paths. Mutations go through API routes, which write to Firebase, which triggers the push.

## Authentication Pattern

- Session-based: random session ID generated at lobby creation/join, stored in `localStorage`
- Sent as `x-session-id` header on all API requests
- Server validates session ID against Firebase private data
- No Firebase Auth SDK — custom lightweight session management

## Key Packages

### Dependencies

| Package                                                | Purpose                              |
| ------------------------------------------------------ | ------------------------------------ |
| `next`                                                 | Fullstack React framework            |
| `react` / `react-dom`                                  | UI rendering                         |
| `@reduxjs/toolkit` / `react-redux`                     | Client state management              |
| `@tanstack/react-query`                                | Server state management              |
| `firebase`                                             | Client SDK (real-time subscriptions) |
| `firebase-admin`                                       | Server SDK (data mutations)          |
| `@sentry/nextjs`                                       | Error tracking                       |
| `@vercel/analytics`                                    | Usage analytics                      |
| `class-variance-authority` / `clsx` / `tailwind-merge` | ShadCN UI utilities                  |
| `lucide-react`                                         | Icons                                |

### Dev Dependencies

| Package                                                                                  | Purpose                                        |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `typescript`                                                                             | Type checking                                  |
| `vitest` / `@testing-library/react` / `happy-dom`                                        | Testing                                        |
| `storybook` / `@storybook/nextjs-vite`                                                   | Component development                          |
| `eslint` / `typescript-eslint` / `eslint-plugin-react-hooks` / `eslint-plugin-storybook` | Linting                                        |
| `prettier`                                                                               | Formatting                                     |
| `prettier-plugin-tailwindcss`                                                            | Automatic Tailwind class sorting (recommended) |
| `husky` / `lint-staged`                                                                  | Pre-commit hooks                               |
| `tailwindcss` / `@tailwindcss/postcss` / `postcss`                                       | Styling                                        |
| `shadcn`                                                                                 | ShadCN UI CLI                                  |

## Initialization Checklist

When starting a new project with this architecture:

1. `pnpm create next-app@latest --typescript --tailwind --eslint --app`
2. `pnpm add @reduxjs/toolkit react-redux @tanstack/react-query firebase firebase-admin @sentry/nextjs @vercel/analytics class-variance-authority clsx tailwind-merge lucide-react`
3. `pnpm add -D vitest @testing-library/react happy-dom @vitejs/plugin-react husky lint-staged typescript-eslint eslint-plugin-react-hooks`
4. `npx shadcn@latest init` (adds ShadCN UI with Tailwind config)
5. `npx storybook@latest init --skip-install` then trim to lean addons (a11y, docs)
6. Configure `vitest.config.mts` with three test projects (node, hooks, components)
7. Configure `eslint.config.js` with strict TS, react-hooks, storybook plugin
8. Set up `.github/actions/setup/action.yml` composite action
9. Set up `.github/workflows/ci-actions.yml` (test, lint, format, build)
10. Configure Firebase project + environment variables
11. Set up Vercel project with GitHub integration
12. Add `AGENTS.md` (or `CLAUDE.md` symlink) with project-specific conventions
