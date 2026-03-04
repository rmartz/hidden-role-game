# Secret Villain Game

A multiplayer social deduction game. Currently in early development — lobby creation and joining is functional.

## Tech Stack

- **[Next.js 15](https://nextjs.org/)** — fullstack React framework (App Router)
- **TypeScript** — strict mode throughout
- **pnpm** — package manager with workspaces
- **Vitest** — test runner

## Project Structure

```
secret-villain-game/
├── app/                        # Next.js app (frontend + backend in one)
│   └── src/
│       ├── app/
│       │   ├── page.tsx               # Main UI
│       │   ├── layout.tsx             # Root layout
│       │   └── api/lobby/             # API Route Handlers
│       │       ├── create/route.ts    # POST /api/lobby/create
│       │       └── [lobbyId]/
│       │           ├── route.ts       # GET /api/lobby/:id
│       │           └── join/route.ts  # POST /api/lobby/:id/join
│       ├── lib/
│       │   ├── models/         # Core domain models (Lobby, Player, Game)
│       │   └── api.ts          # Client-side fetch wrapper
│       ├── server/
│       │   ├── models/         # API response types (public-facing)
│       │   └── lobby-helpers.ts
│       └── services/
│           └── LobbyService.ts # In-memory lobby store (singleton)
├── package.json                # Workspace root (tooling: ESLint, Prettier, Husky)
└── pnpm-workspace.yaml
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## API

All API routes are served by the same Next.js process — no separate server needed.

| Method | Path                  | Description                                      |
| ------ | --------------------- | ------------------------------------------------ |
| `POST` | `/api/lobby/create`   | Create a lobby; returns lobby + session ID       |
| `GET`  | `/api/lobby/:id`      | Get lobby state (requires `x-session-id` header) |
| `POST` | `/api/lobby/:id/join` | Join a lobby; returns lobby + session ID         |

Session IDs are stored in `localStorage` and sent as the `x-session-id` header. They are never included in lobby responses — only returned once on create/join.

## Development

```bash
# Lint
pnpm lint

# Format
pnpm format
```

CI runs on every PR: **Tests**, **Lint**, and **Build**.
