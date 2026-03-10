# Hidden Role Game

A multiplayer social deduction game platform. Players join a lobby, are secretly assigned roles, and play through night and day phases. Supports multiple game modes.

## Tech Stack

- **[Next.js 15](https://nextjs.org/)** — fullstack React framework (App Router)
- **TypeScript** — strict mode throughout
- **pnpm** — package manager with workspaces
- **TanStack Query** — server state and polling
- **[PartyKit](https://www.partykit.io/)** — real-time WebSocket notifications
- **Vitest** — test runner

## Project Structure

```
hidden-role-game/
├── app/                        # Next.js app (frontend + backend in one)
│   ├── party/
│   │   └── server.ts           # PartyKit room server (lobby real-time notifications)
│   └── src/
│       ├── app/
│       │   ├── page.tsx               # Home — create or join a lobby
│       │   ├── lobby/[lobbyId]/       # Lobby UI (role config, waiting room)
│       │   ├── game/[gameId]/         # Player game view
│       │   │   ├── werewolf/          # Werewolf mode screen components
│       │   │   └── owner/             # Owner game view
│       │   └── api/
│       │       ├── lobby/             # Lobby API routes
│       │       └── game/              # Game API routes
│       ├── lib/
│       │   ├── models/         # Core domain models
│       │   └── game-modes/     # Per-mode role definitions (Werewolf, Avalon, …)
│       ├── server/
│       │   ├── models/         # API response types (public-facing)
│       │   └── utils/          # Server-only helpers (auth, role slots, role assignment)
│       ├── services/
│       │   ├── LobbyService.ts          # In-memory lobby store
│       │   ├── GameService.ts           # In-memory game store
│       │   └── LobbyBroadcastService.ts # Notifies PartyKit on lobby state changes
│       └── hooks/
│           └── lobbySocket.ts  # Client-side PartyKit WebSocket hook
├── package.json                # Workspace root (tooling: ESLint, Prettier, Husky)
└── pnpm-workspace.yaml
```

## Game Flow

1. A player creates a lobby and configures the role mix
2. Players join via share link
3. The lobby owner starts the game — roles are secretly assigned
4. **Night phase**: roles wake in order and take actions; the owner advances each phase
5. **Day phase**: players discuss; the owner advances to the next night
6. Repeat until the game ends

The lobby owner has a dedicated `/owner` view with full role visibility and controls to advance phases.

## Real-Time Updates

Lobby state changes are pushed to all connected clients via PartyKit WebSockets. The Next.js API routes POST a lightweight notification to PartyKit after each mutation; clients re-fetch the full lobby state from Next.js directly. This keeps all authorization and sensitive data server-side.

## Getting Started

```bash
# Install dependencies
pnpm install

# Start Next.js dev server (http://localhost:3000)
pnpm dev

# In a separate terminal: start PartyKit dev server (ws://localhost:1999)
# Required for real-time lobby updates during local development
pnpm dev:party
```

## API

All API routes are served by the same Next.js process — no separate server needed.

### Lobby

| Method   | Path                          | Description                                |
| -------- | ----------------------------- | ------------------------------------------ |
| `POST`   | `/api/lobby/create`           | Create a lobby; returns lobby + session ID |
| `GET`    | `/api/lobby/:id`              | Get lobby state                            |
| `POST`   | `/api/lobby/:id/join`         | Join a lobby; returns lobby + session ID   |
| `PUT`    | `/api/lobby/:id/config`       | Update role configuration (owner only)     |
| `PUT`    | `/api/lobby/:id/owner`        | Transfer ownership (owner only)            |
| `DELETE` | `/api/lobby/:id/players/:pid` | Remove a player (owner or self)            |

### Game

| Method | Path                    | Description                                |
| ------ | ----------------------- | ------------------------------------------ |
| `POST` | `/api/game/create`      | Start a game from a lobby; returns game ID |
| `GET`  | `/api/game/:id`         | Get game state for the current player      |
| `POST` | `/api/game/:id/advance` | Advance game status (owner only)           |
| `POST` | `/api/game/:id/action`  | Submit a role action                       |

Session IDs are stored in `localStorage` and sent as the `x-session-id` header.

## Development

```bash
# Run tests
pnpm test

# Lint
pnpm lint

# Format
pnpm format

# Type check
pnpm --filter @hidden-role/app exec tsc --noEmit

# Deploy PartyKit to production
pnpm --filter @hidden-role/app party:deploy
```

CI runs on every PR: **Tests**, **Lint**, **Format**, and **Build**.
