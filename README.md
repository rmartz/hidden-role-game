# Hidden Role Game

A multiplayer social deduction game platform. Players join a lobby, are secretly assigned roles, and play through game-mode-specific phases. Supports multiple game modes.

## Tech Stack

- **[Next.js](https://nextjs.org/)** — fullstack React framework (App Router)
- **TypeScript** — strict mode throughout
- **pnpm** — package manager
- **TanStack Query** — server state management
- **[Firebase Realtime Database](https://firebase.google.com/docs/database)** — persistent storage and real-time push updates
- **Vitest** — test runner
- **Storybook** — component development and visual documentation

## Getting Started

```bash
pnpm install
cp .env.example .env.local  # fill in Firebase credentials
pnpm dev                    # http://localhost:3000
```

See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for a full new-developer orientation including how to run tests without Firebase, where game logic lives, and how to add a new game mode.

## Development

```bash
pnpm test             # Run tests (watch mode)
pnpm test --run       # Run tests (single pass)
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm tsc              # Type check
pnpm storybook        # Storybook dev server at http://localhost:6006
pnpm build-storybook  # Static Storybook build
```

CI runs on every PR: **Tests**, **Lint**, **Format**, and **Build**.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for code style guidelines and conventions.

## Game Modes

Three game modes are supported. See [docs/GAME_MODES.md](docs/GAME_MODES.md) for per-mode role, action, and data flow documentation.

- **Werewolf** — narrator-driven night/day deduction game; fully app-mediated
- **Secret Villain** — election and policy game with asymmetric Bad team visibility; fully app-mediated
- **Avalon** — quest-voting game; app handles role distribution only

## Game Flow

1. A player creates a lobby and configures the role mix
2. Players join via share link
3. The lobby owner starts the game — roles are secretly assigned
4. Players interact through game-mode-specific phases (elections, night actions, etc.)
5. The game ends when a win condition is met

Werewolf uses a Narrator (the lobby owner) who controls night-phase progression. Secret Villain and Avalon are fully player-driven with the app mediating all interactions.

## Real-Time Updates

State changes are pushed to clients in real time via Firebase Realtime Database subscriptions:

- **Lobby**: clients subscribe to `lobbies/{lobbyId}/public` via `onValue`
- **Game**: each player subscribes to `games/{gameId}/playerState/{sessionId}`. The server pre-computes and writes every player's `PlayerGameState` to Firebase on each mutation, so updates arrive immediately without an extra HTTP round-trip

The Firebase schema separates public and private data. Private data (session IDs) is stored at `lobbies/{id}/private` and is only accessed via the Admin SDK in API routes — never exposed to the client.

## Source Code Organization

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for a detailed breakdown of every directory.

### `src/app/`

Next.js pages and API routes. Pages handle auth/redirect; API routes parse requests and delegate to `src/server/`. No business logic lives here.

### `src/lib/`

Shared logic used by both server and client. Contains core domain types (`lib/types/`), Firebase schema helpers (`lib/firebase/schema/`), and all game-mode logic (`lib/game/modes/`). The per-mode directories hold turn state definitions, action handlers, role definitions, and player-state extraction.

### `src/server/`

Server-side orchestration called by API routes. `server/game.ts` and `server/lobby.ts` coordinate game/lobby operations; `server/utils/` holds request authentication, role slot validation, and role assignment. Nothing in `server/` is imported by client components.

### `src/services/`

All Firebase Realtime Database reads and writes. This is the only layer that calls `getAdminDatabase()`. Functions here accept and return typed domain objects; wire-format conversion happens in `lib/firebase/schema/`.

### `src/hooks/`

React hooks for real-time state. `useGameStateQuery` subscribes to `games/{gameId}/playerState/{sessionId}` and `useLobbyQuery` subscribes to `lobbies/{lobbyId}/public` — both via Firebase `onValue`. Components never read from Firebase directly.

### `src/components/`

UI components split by domain: `lobby/` for the waiting room and config panel, `game/werewolf/` and `game/secret-villain/` for in-game phase UIs, and `ui/` for ShadCN primitives.

## API

All API routes are served by the same Next.js process — no separate server needed. Session IDs are stored in `localStorage` and sent as the `x-session-id` header.

### Lobby

| Method   | Path                               | Description                                |
| -------- | ---------------------------------- | ------------------------------------------ |
| `POST`   | `/api/lobby/create`                | Create a lobby; returns lobby + session ID |
| `GET`    | `/api/lobby/:id`                   | Get lobby state                            |
| `POST`   | `/api/lobby/:id/join`              | Join a lobby; returns lobby + session ID   |
| `PUT`    | `/api/lobby/:id/config`            | Update role configuration (owner only)     |
| `PUT`    | `/api/lobby/:id/owner`             | Transfer ownership (owner only)            |
| `POST`   | `/api/lobby/:id/ready`             | Mark self as ready                         |
| `POST`   | `/api/lobby/:id/return`            | Return to lobby after a game ends          |
| `DELETE` | `/api/lobby/:id/players/:playerId` | Remove a player (owner or self)            |

### Game

| Method | Path                              | Description                                  |
| ------ | --------------------------------- | -------------------------------------------- |
| `POST` | `/api/:gameMode/game/create`      | Start a game from a lobby                    |
| `GET`  | `/api/:gameMode/game/:id`         | Get game state for the current player        |
| `POST` | `/api/:gameMode/game/:id/advance` | Advance game phase (Narrator only, Werewolf) |
| `POST` | `/api/:gameMode/game/:id/action`  | Submit a game action                         |

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
