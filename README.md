# Hidden Role Game

A multiplayer social deduction game platform. Players join a lobby, are secretly assigned roles, and play through night and day phases. Supports multiple game modes.

## Tech Stack

- **[Next.js](https://nextjs.org/)** — fullstack React framework (App Router)
- **TypeScript** — strict mode throughout
- **pnpm** — package manager
- **TanStack Query** — server state management
- **[Firebase Realtime Database](https://firebase.google.com/docs/database)** — persistent storage and real-time push updates
- **Vitest** — test runner
- **Storybook** — component development and visual documentation

## Project Structure

```
hidden-role-game/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Home — create or join a lobby
│   │   ├── [gameMode]/lobby/      # Lobby UI (role config, waiting room)
│   │   ├── [gameMode]/game/       # Player game view
│   │   └── api/
│   │       ├── lobby/             # Lobby API routes
│   │       └── [gameMode]/game/   # Game API routes
│   ├── lib/
│   │   ├── firebase/       # Firebase Admin + client SDK wrappers and RTDB schema
│   │   ├── types/          # Core domain types
│   │   └── game-modes/     # Per-mode role definitions (Werewolf, Avalon, Secret Villain)
│   ├── server/
│   │   ├── types/          # API response types (public-facing)
│   │   └── utils/          # Server-only helpers (auth, role slots, role assignment)
│   ├── services/
│   │   ├── GameService.ts           # Orchestrator: combines logic + data access
│   │   ├── GameStateService.ts      # Pure business logic (player state, role assignment)
│   │   ├── FirebaseGameService.ts   # Firebase I/O for games (read/write/transactions)
│   │   └── FirebaseLobbyService.ts  # Firebase I/O for lobbies
│   └── hooks/
│       ├── lobbySocket.ts  # Firebase RTDB real-time lobby subscription
│       └── game.ts         # Firebase RTDB real-time game state subscription
├── docs/                   # Game mode documentation
├── .storybook/          # Storybook configuration
├── package.json
├── tsconfig.json
├── next.config.ts
└── vitest.config.mts
```

## Game Modes

See [docs/](docs/README.md) for detailed documentation on each game mode, including roles, actions, and data flow.

## Game Flow

1. A player creates a lobby and configures the role mix
2. Players join via share link
3. The lobby owner starts the game — roles are secretly assigned
4. Players interact through game-mode-specific phases (elections, night actions, quests, etc.)
5. The game ends when a win condition is met

Some game modes (Werewolf, Clocktower) use a narrator who controls phase progression. Others (Secret Villain, Avalon) are fully player-driven with the app mediating all interactions.

## Real-Time Updates

State changes are pushed to clients in real time via Firebase Realtime Database subscriptions:

- **Lobby**: clients subscribe to `lobbies/{lobbyId}/public` via `onValue`. The lobby owner's config edits are the source of truth — the client skips echoed config-only updates to avoid overwriting local state.
- **Game**: each player subscribes to `games/{gameId}/playerState/{sessionId}`. The server pre-computes and writes every player's `PlayerGameState` to Firebase on each mutation, so updates arrive immediately without an extra HTTP round-trip.

The Firebase schema separates public and private data. Private data (session IDs) is stored at `lobbies/{id}/private` and is only accessed via the Admin SDK in API routes — never exposed to the client.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase project values.

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
pnpm tsc

# Storybook
pnpm storybook        # Dev server at http://localhost:6006
pnpm build-storybook  # Static build
```

CI runs on every PR: **Tests**, **Lint**, **Format**, and **Build**.
