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

The engine handles routing, authentication, Firebase persistence, and role assignment automatically. Adding a game mode means plugging the mode's own logic into a set of well-defined interfaces — the engine calls your code at the right moments.

The starting point for any new mode is its directory: `src/lib/game/modes/{mode}/`.

### 1. Define roles in `roles.ts`

A role definition specifies the role's ID, display name, and which team it belongs to. It also optionally declares an `awareOf` rule — the visibility information that role receives at game start (i.e., which other players this role can see, and whether they see the full role ID or just the team).

```ts
export enum MyGameRole {
  Villager = "my-game-villager",
  Werewolf = "my-game-werewolf",
}

export const MY_GAME_ROLES = {
  [MyGameRole.Villager]: {
    id: MyGameRole.Villager,
    name: "Villager",
    team: Team.Good,
    // No awareOf — Villagers see no one
  },
  [MyGameRole.Werewolf]: {
    id: MyGameRole.Werewolf,
    name: "Werewolf",
    team: Team.Bad,
    awareOf: { teams: [Team.Bad], revealRole: true },
    // Werewolves see all Bad team members and their exact role
  },
};
```

The `awareOf` field drives `visibleRoleAssignments` in every player's `BasePlayerGameState` — if you set it correctly here, the engine handles the rest. Role IDs must be globally unique across all game modes to avoid collisions in the Firebase schema (prefix them with the mode name as shown above).

Also export a `defaultRoleCount(numPlayers)` function that returns the recommended `RoleSlot[]` for a given player count. This populates the lobby config panel automatically.

### 2. Define turn state in `types.ts`

The turn state is the server-side source of truth for everything that happens during a game. It is never sent to clients directly — `extractPlayerState` (step 3) decides what each player sees.

A **turn** is one complete cycle of the game's main loop (e.g., one presidency in Secret Villain, one night/day cycle in Werewolf). Within a turn, the game moves through a sequence of **phases** — distinct moments where a specific player or set of players can act. Each phase ends when its required actions are complete, which advances the game to the next phase (or starts a new turn). A **player action** is a single step within a phase: one vote, one card pick, one nomination. Actions are validated against the current phase to ensure only the right player can act at the right time.

Define a `{Mode}TurnState` interface that holds all mutable game state: current phase, card decks, player positions, vote records, etc. If the game has multiple phases, define a phase enum and per-phase interfaces (as a discriminated union) and include the current phase as a field on the turn state.

For a simple game mode with no turn state (e.g., one where the app only handles role distribution), `buildInitialTurnState` can return `undefined` and `types.ts` can be omitted.

### 3. Implement services in `services.ts`

This is the most important file in the mode. It exports a `GameModeServices` object with three methods that the engine calls at key moments:

**`buildInitialTurnState(roleAssignments, options)`** — called once when the lobby owner starts the game. Receives the role-to-player assignments and any mode-specific config from the lobby. Returns the initial turn state.

**`extractPlayerState(game, callerId)`** — called after every action, once per player. Receives the full game object and the ID of the player whose state is being built. Returns a plain object that will be merged into that player's `PlayerGameState` and written to Firebase. This is where all visibility logic lives: if the current player is the president, include their policy cards; if they are eliminated, mark them as dead; etc.

**`selectSpecialTargets()`** — called at game creation to designate players for mode-specific special roles that need to know each other (e.g., pointing a Bodyguard at their target). For most modes this returns `{}`.

Avalon's services are a useful minimal example:

```ts
export const avalonServices: GameModeServices = {
  buildInitialTurnState() {
    return undefined; // Role distribution only — no turn state needed
  },
  selectSpecialTargets() {
    return {};
  },
  extractPlayerState() {
    return {}; // BasePlayerGameState fields are added by the engine
  },
};
```

Secret Villain's `services.ts` is a fully-featured example with phase-gated visibility logic.

### 4. Implement `GameModeConfig` in `config.ts`

`config.ts` is the manifest that registers the mode with the engine. Use `satisfies GameModeConfig` — TypeScript will catch any missing or mistyped fields at compile time, and you get autocomplete without losing the concrete type.

```ts
export const MY_GAME_CONFIG = {
  name: "My Game",
  released: false, // set true to show in production
  minPlayers: 5,
  ownerTitle: null, // set to e.g. "Narrator" if one player controls the game
  teamLabels: {
    [Team.Good]: "Villager",
    [Team.Bad]: "Werewolf",
  },
  roles: MY_GAME_ROLES,
  defaultRoleCount,
  defaultTimerConfig: DEFAULT_TIMER_CONFIG,
  defaultModeConfig: DEFAULT_MY_GAME_MODE_CONFIG,
  parseModeConfig: parseMyGameModeConfig,
  buildDefaultLobbyConfig: buildDefaultMyGameLobbyConfig,
  actions: MY_GAME_ACTIONS,
  services: myGameServices,
} satisfies GameModeConfig;
```

`ownerTitle` controls whether one player takes a special owner role (e.g., `"Narrator"` in Werewolf). When non-null, the lobby owner is not dealt a role and instead controls phase progression via the advance endpoint.

### 5. Register the mode in `src/lib/game/modes.ts`

Add the mode's enum value to `GameMode` in `src/lib/types/game.ts`, then add an entry to `GAME_MODES` in `src/lib/game/modes.ts`:

```ts
export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  [GameMode.SecretVillain]: SECRET_VILLAIN_CONFIG,
  [GameMode.Avalon]: AVALON_CONFIG,
  [GameMode.Werewolf]: WEREWOLF_CONFIG,
  [GameMode.MyGame]: MY_GAME_CONFIG, // add this
};
```

This is the only place outside the mode directory that needs to be touched. The home page, lobby creation, game routing, and Firebase schema are all keyed off `GameMode` and will pick up the new entry automatically. Modes with `released: false` are only visible in development.

### 6. Add a `[Mode]PlayerGameState` in `player-state.ts`

Extend `BasePlayerGameState` with all mode-specific fields that `extractPlayerState` may include. This gives TypeScript end-to-end safety from server to component — the mode screen component narrows to this type and gets compile-time guarantees about every field it reads.

```ts
export interface MyGamePlayerGameState extends BasePlayerGameState {
  gameMode: GameMode.MyGame;
  myGamePhase?: MyGamePhase;
  // ... other mode-specific fields
}
```

For a mode with no turn state (like the current Avalon stub), the interface only needs the `gameMode` discriminant:

```ts
export interface AvalonPlayerGameState extends BasePlayerGameState {
  gameMode: GameMode.Avalon;
}
```

### 7. Add actions in `actions/`

Each player action is a file exporting a `GameAction` with two methods: `isValid` (can this player take this action right now?) and `apply` (mutate the turn state). Actions are registered in `config.ts` under the `actions` key as a `Record<string, GameAction>`.

See `src/lib/game/modes/secret-villain/actions/nominate-chancellor.ts` for a short, well-commented example.

### 8. Add documentation under `docs/{mode}/`

Add `roles.md`, `actions.md`, and `data-flow.md` following the same structure as the existing `docs/secret-villain/` and `docs/werewolf/` directories. Keep these in sync with the code — outdated docs are worse than no docs.
