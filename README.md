# Hidden Role Game

A multiplayer social deduction game platform. Players join a lobby, are secretly assigned roles, and play through night and day phases. Supports multiple game modes.

## Tech Stack

- **[Next.js 15](https://nextjs.org/)** — fullstack React framework (App Router)
- **TypeScript** — strict mode throughout
- **pnpm** — package manager with workspaces
- **TanStack Query** — server state and polling
- **Vitest** — test runner

## Project Structure

```
hidden-role-game/
├── app/                        # Next.js app (frontend + backend in one)
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
│       │   └── models/         # API response types (public-facing)
│       └── services/
│           ├── LobbyService.ts # In-memory lobby store
│           └── GameService.ts  # In-memory game store
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

### Lobby

| Method   | Path                          | Description                                |
| -------- | ----------------------------- | ------------------------------------------ |
| `POST`   | `/api/lobby/create`           | Create a lobby; returns lobby + session ID |
| `GET`    | `/api/lobby/:id`              | Get lobby state                            |
| `POST`   | `/api/lobby/:id/join`         | Join a lobby; returns lobby + session ID   |
| `PUT`    | `/api/lobby/:id/config`       | Update role configuration (owner only)     |
| `GET`    | `/api/lobby/:id/owner`        | Get full lobby state (owner only)          |
| `DELETE` | `/api/lobby/:id/players/:pid` | Remove a player (owner only)               |

### Game

| Method | Path                    | Description                                       |
| ------ | ----------------------- | ------------------------------------------------- |
| `POST` | `/api/game/create`      | Start a game from a lobby; returns game ID        |
| `GET`  | `/api/game/:id`         | Get game state for the current player             |
| `POST` | `/api/game/:id/advance` | Advance game status (owner only)                  |
| `POST` | `/api/game/:id/phase`   | Advance night phase to the next role (owner only) |

Session IDs are stored in `localStorage` and sent as the `x-session-id` header.

## Development

```bash
# Lint
pnpm lint

# Format
pnpm format
```

CI runs on every PR: **Tests**, **Lint**, and **Build**.
