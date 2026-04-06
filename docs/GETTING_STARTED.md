# Getting Started

A guide for new developers getting acquainted with the codebase.

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- A Firebase project with Realtime Database enabled (or use the in-memory mock for tests)

## Initial Setup

```bash
git clone <repo>
cd hidden-role-game
pnpm install

cp .env.example .env.local
# Fill in Firebase credentials (see README for variable names)

pnpm dev   # http://localhost:3000
```

## Running Tests Without Firebase

The test suite uses an in-memory Firebase Admin mock (`src/test-setup/firebase-admin-mock.ts`), so no real Firebase project is needed to run tests:

```bash
pnpm test        # watch mode
pnpm test --run  # single pass
pnpm tsc         # type check
pnpm lint        # ESLint
```

## Key Concepts

### Request lifecycle

1. A client action (e.g., casting a vote) calls `POST /api/[gameMode]/game/[gameId]/action` with an action ID and payload
2. The route handler in `src/app/api/[gameMode]/game/[gameId]/action/route.ts` authenticates the caller via `x-session-id` header and delegates to `applyAction` in `src/server/game.ts`
3. `applyAction` loads the game from Firebase, finds the matching action handler in the game mode's `actions` map, validates and applies it, then writes the updated status back via a Firebase transaction
4. After the transaction, all player states are recomputed by `buildAllPlayerStates` and written to `games/{gameId}/playerState/{sessionId}` in Firebase
5. Clients subscribed via `onValue` receive the update immediately — no polling needed

### Where game logic lives

Game-mode-specific logic lives entirely in `src/lib/game/modes/{mode}/`:

| File          | Purpose                                                                            |
| ------------- | ---------------------------------------------------------------------------------- |
| `services.ts` | `buildInitialTurnState` and `extractPlayerState` — the two core integration points |
| `actions/`    | One file per action; each exports a `GameAction` with `isValid` + `apply`          |
| `types.ts`    | Turn state shape and mode-specific enums                                           |
| `roles.ts`    | Role definitions and team assignments                                              |
| `config.ts`   | `GameModeConfig` object consumed by the shared game engine                         |

Adding a new action means creating an action file and registering it in `config.ts`. The shared engine handles routing, validation, and Firebase persistence.

### Player state computation

Each player receives a tailored view of game state. `extractPlayerState` in each mode's `services.ts` takes the full game and a caller ID and returns only the fields that player is allowed to see. This is where role-based visibility is enforced — e.g., the president sees drawn policy cards, the chancellor sees the remaining cards, and other players see neither.

The result is merged with the base player state (role, players list, timer config, etc.) in `buildAllPlayerStates` (`src/lib/game/state.ts`) and written to Firebase.

### Real-time updates

- **Lobby**: `useLobbyQuery` in `src/hooks/lobby.ts` subscribes to `lobbies/{lobbyId}/public` via Firebase `onValue`
- **Game state**: `useGameStateQuery` in `src/hooks/game.ts` subscribes to `games/{gameId}/playerState/{sessionId}` via Firebase `onValue`

Neither hook polls — updates arrive the moment the server writes to Firebase.

### Session identity

Players are identified by a UUID session ID stored in `localStorage` and sent with every API request as the `x-session-id` header. There is no login system. `authenticateLobby` / `authenticateGame` in `src/server/utils/api-helpers.ts` resolve the session to a player and enforce access control.

## Recommended Reading Order

1. **[docs/PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** — directory-by-directory breakdown
2. **`src/lib/types/`** — start with `game.ts` and `lobby.ts` to understand the core data shapes
3. **`src/lib/game/modes/secret-villain/services.ts`** — a well-commented example of `buildInitialTurnState` and `extractPlayerState`
4. **`src/lib/game/modes/secret-villain/actions/nominate-chancellor.ts`** — a short example action
5. **`src/server/game.ts`** — the server-side orchestration layer that glues actions to Firebase
6. **[docs/GAME_MODES.md](GAME_MODES.md)** — per-mode role, action, and data flow documentation

## Adding a New Game Mode

1. Create `src/lib/game/modes/{mode}/` with `config.ts`, `types.ts`, `roles.ts`, `services.ts`, and an `actions/` directory
2. Implement `GameModeServices` in `services.ts` (`buildInitialTurnState`, `extractPlayerState`, `selectSpecialTargets`)
3. Implement `GameModeConfig` in `config.ts` (`satisfies GameModeConfig` will catch missing fields)
4. Register the mode in `src/lib/game/modes.ts` under `GAME_MODES`
5. Add a `[PlayerGameState]` interface extending `BasePlayerGameState` in a `player-state.ts` file
6. Add documentation under `docs/{mode}/`
