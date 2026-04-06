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

The test suite uses an in-memory Firebase Admin mock, so no real Firebase project is needed:

```bash
pnpm test        # watch mode
pnpm test --run  # single pass
pnpm tsc         # type check
pnpm lint        # ESLint
```

## How the App Works

Before diving into code, it helps to understand the three core concepts the app is built around.

**Lobbies** are pre-game rooms where players gather and the owner configures the role mix. A lobby holds the player list, role slots, and game settings. Once the owner starts the game, the lobby transitions to an active game.

**Games** hold the live gameplay state. Each game mode has its own turn state (who is president, what cards are in the deck, etc.) that evolves as players take actions. The server pre-computes a tailored view of that state for each player so that no player can see information they shouldn't.

**Sessions** are how players identify themselves. When a player creates or joins a lobby they receive a session ID stored in `localStorage`. Every API request includes this ID as a header — there is no login system.

## Request Lifecycle

Every player action follows the same high-level pattern:

1. The client submits an action to the server via HTTP
2. The server authenticates the caller, validates the action, and applies it to the game state
3. The updated state is persisted to Firebase
4. Firebase immediately pushes the change to all subscribed clients — no polling needed

This means players see each other's moves in real time without refreshing the page or the client asking "did anything change?"

### Example: casting an election vote

Here is the same lifecycle traced through the actual code for one concrete action.

1. The player taps "Vote Aye" — the client calls `POST /api/secret-villain/game/{gameId}/action` with `{ actionId: "cast-election-vote", payload: { vote: "aye" } }`
2. The route handler in `src/app/api/[gameMode]/game/[gameId]/action/route.ts` reads the `x-session-id` header, calls `authenticateGame` to resolve it to a player, then calls `applyAction` in `src/server/game.ts`
3. `applyAction` loads the game from Firebase, looks up the `cast-election-vote` handler in the mode's `actions` map, calls `isValid` to confirm the player may act, then calls `apply` to mutate the turn state
4. The updated status is written back to Firebase via a transaction
5. `buildAllPlayerStates` recomputes every player's tailored view and writes each one to `games/{gameId}/playerState/{sessionId}` in Firebase
6. Each client's `useGameStateQuery` hook receives the write via `onValue` and re-renders

## Where Game Logic Lives

All game-mode-specific logic lives in `src/lib/game/modes/{mode}/`. The shared game engine handles routing, validation, and Firebase persistence — mode code only needs to describe what happens, not how it gets stored.

The two most important integration points are:

- **`services.ts`** — `buildInitialTurnState` sets up a fresh game; `extractPlayerState` takes the full game and a player ID and returns only what that player is allowed to see
- **`actions/`** — one file per action, each exporting a `GameAction` with `isValid` (can this player do this right now?) and `apply` (mutate the turn state)

Everything else in the mode directory (`types.ts`, `roles.ts`, `config.ts`, `player-state.ts`, `copy.ts`) supports those two integration points.

## Player State Computation

One of the most important patterns in the codebase is that **the server computes what each player can see before writing it to Firebase** — the client never filters game state itself.

`extractPlayerState` enforces all role-based visibility rules: the president sees the three drawn policy cards, the chancellor sees the two remaining cards, and all other players see neither. Bad team members see each other's identities; Good players see no one's identity.

After each action, `buildAllPlayerStates` calls `extractPlayerState` for every player and writes the results to Firebase. Clients subscribe to their own path and receive exactly the state they're supposed to see.

## Real-Time Updates

The client never polls. Two Firebase `onValue` subscriptions handle all live state:

- **`useLobbyQuery`** subscribes to `lobbies/{lobbyId}/public` — updates arrive whenever the owner changes config or a player joins/leaves
- **`useGameStateQuery`** subscribes to `games/{gameId}/playerState/{sessionId}` — updates arrive the moment the server writes a new player state after any action

Components read from these hooks; they never call Firebase directly.

## Session Identity

Players are identified by a UUID session ID stored in `localStorage` and sent with every API request as the `x-session-id` header. `authenticateLobby` and `authenticateGame` in `src/server/utils/api-helpers.ts` resolve the session to a player and enforce access control.

## Recommended Reading Order

1. **[docs/PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** — directory-by-directory breakdown
2. **`src/lib/types/game.ts` and `lobby.ts`** — the core data shapes everything else is built on
3. **`src/lib/game/modes/secret-villain/services.ts`** — a well-commented example of `buildInitialTurnState` and `extractPlayerState`
4. **`src/lib/game/modes/secret-villain/actions/nominate-chancellor.ts`** — a short, self-contained action
5. **`src/server/game.ts`** — the orchestration layer that connects actions to Firebase
6. **[docs/GAME_MODES.md](GAME_MODES.md)** — per-mode role, action, and data flow documentation

## Adding a New Game Mode

1. Create `src/lib/game/modes/{mode}/` with `config.ts`, `types.ts`, `roles.ts`, `services.ts`, and an `actions/` directory
2. Implement `GameModeServices` in `services.ts` (`buildInitialTurnState`, `extractPlayerState`, `selectSpecialTargets`)
3. Implement `GameModeConfig` in `config.ts` — `satisfies GameModeConfig` will catch missing fields at compile time
4. Register the mode in `src/lib/game/modes.ts` under `GAME_MODES`
5. Add a `[Mode]PlayerGameState` interface extending `BasePlayerGameState` in `player-state.ts`
6. Add documentation under `docs/{mode}/`
