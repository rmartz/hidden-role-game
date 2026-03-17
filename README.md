# Hidden Role Game

A multiplayer social deduction game platform. Players join a lobby, are secretly assigned roles, and play through night and day phases. Supports multiple game modes.

## Tech Stack

- **[Next.js 15](https://nextjs.org/)** — fullstack React framework (App Router)
- **TypeScript** — strict mode throughout
- **pnpm** — package manager with workspaces
- **TanStack Query** — server state management
- **[Firebase Realtime Database](https://firebase.google.com/docs/database)** — persistent storage and real-time push updates
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
│       │   ├── firebase/       # Firebase Admin + client SDK wrappers and RTDB schema
│       │   ├── types/          # Core domain types
│       │   └── game-modes/     # Per-mode role definitions (Werewolf, Avalon, …)
│       ├── server/
│       │   ├── types/          # API response types (public-facing)
│       │   └── utils/          # Server-only helpers (auth, role slots, role assignment)
│       ├── services/
│       │   ├── FirebaseLobbyService.ts  # Firebase-backed lobby store
│       │   └── FirebaseGameService.ts   # Firebase-backed game store
│       └── hooks/
│           ├── lobbySocket.ts  # Firebase RTDB real-time lobby subscription
│           └── game.ts         # Firebase RTDB real-time game state subscription
├── package.json                # Workspace root (tooling: ESLint, Prettier, Husky)
└── pnpm-workspace.yaml
```

## Game Modes

See [docs/](docs/README.md) for detailed documentation on each game mode, including roles, actions, and data flow.

## Game Flow

1. A player creates a lobby and configures the role mix
2. Players join via share link
3. The lobby owner starts the game — roles are secretly assigned
4. **Night phase**: roles wake in order and take actions; the owner advances each phase
5. **Day phase**: players discuss; the owner advances to the next night
6. Repeat until the game ends

The lobby owner has a dedicated `/owner` view with full role visibility and controls to advance phases.

## Real-Time Updates

State changes are pushed to clients in real time via Firebase Realtime Database subscriptions:

- **Lobby**: clients subscribe to `lobbies/{lobbyId}/public` via `onValue`. The lobby owner's config edits are the source of truth — the client skips echoed config-only updates to avoid overwriting local state.
- **Game**: each player subscribes to `games/{gameId}/playerState/{sessionId}`. The server pre-computes and writes every player's `PlayerGameState` to Firebase on each mutation, so updates arrive immediately without an extra HTTP round-trip.

The Firebase schema separates public and private data. Private data (session IDs) is stored at `lobbies/{id}/private` and is only accessed via the Admin SDK in API routes — never exposed to the client.

## Environment Variables

Copy `app/.env.example` to `app/.env.local` and fill in your Firebase project values.

| Variable                            | Description                                |
| ----------------------------------- | ------------------------------------------ |
| `FIREBASE_PROJECT_ID`               | Firebase project ID (server)               |
| `FIREBASE_CLIENT_EMAIL`             | Service account client email               |
| `FIREBASE_PRIVATE_KEY`              | Service account private key (literal `\n`) |
| `FIREBASE_DATABASE_URL`             | RTDB URL, e.g. `https://…firebaseio.com`   |
| `NEXT_PUBLIC_FIREBASE_API_KEY`      | Client SDK API key                         |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`  | Client SDK auth domain                     |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`   | Client SDK project ID                      |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Client SDK RTDB URL                        |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for code style guidelines and conventions.

## Getting Started

```bash
# Install dependencies
pnpm install

# Start Next.js dev server
pnpm dev   # http://localhost:3000
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

```

CI runs on every PR: **Tests**, **Lint**, **Format**, and **Build**.
