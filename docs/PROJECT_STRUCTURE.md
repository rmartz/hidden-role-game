# Project Structure

A directory-by-directory breakdown of the codebase.

## Top-Level

```
hidden-role-game/
├── src/                  # All application source
├── docs/                 # Game mode and project documentation
├── .storybook/           # Storybook configuration
├── AGENTS.md             # AI assistant directives (symlinked as CLAUDE.md)
├── package.json
├── tsconfig.json
├── next.config.ts
└── vitest.config.mts
```

## `src/app/`

Next.js App Router. Pages and API routes.

```
app/
├── page.tsx                              # Home — game mode selection
├── debug/                                # Debug game viewer (dev only)
├── [gameMode]/
│   ├── lobby/[lobbyId]/                  # Lobby page (waiting room + config)
│   │   └── conflict/                     # Session conflict resolution
│   └── game/[gameId]/                    # In-game player view
└── api/
    ├── lobby/
    │   ├── create/                       # POST — create a lobby
    │   ├── [lobbyId]/                    # GET — lobby state
    │   │   ├── join/                     # POST — join a lobby
    │   │   ├── ready/                    # POST — mark self ready
    │   │   ├── return/                   # POST — return to lobby after game
    │   │   ├── owner/                    # PUT — transfer ownership
    │   │   ├── config/                   # PUT — update role config
    │   │   └── players/[playerId]/       # DELETE — remove player or leave
    ├── [gameMode]/game/
    │   ├── create/                       # POST — start game from lobby
    │   └── [gameId]/
    │       ├── route.ts                  # GET — player game state
    │       ├── action/                   # POST — submit a game action
    │       └── advance/                  # POST — advance phase (Narrator only)
    ├── auth/firebase-token/              # POST — exchange session for Firebase token
    ├── debug/game/                       # POST — create debug game; GET — list games
    └── cron/prune-stale/                 # GET — clean up stale lobbies/games
```

## `src/lib/`

Shared logic that runs on both server and client. No Firebase Admin SDK calls — only pure logic, type definitions, and Firebase client-SDK helpers.

```
lib/
├── api.ts                  # HTTP client helpers (typed fetch wrappers)
├── utils.ts                # General utilities (cn, etc.)
├── types/                  # Core domain types (Game, Lobby, Player, ModeConfig, etc.)
├── firebase/
│   ├── admin.ts            # Firebase Admin SDK initialization (server only)
│   ├── client.ts           # Firebase client SDK initialization
│   └── schema/             # Conversion between typed interfaces and Firebase wire format
│       └── player-state/   # Per-mode PlayerGameState serialization
└── game/
    ├── modes.ts            # GAME_MODES registry, getRoleSlotsRequired, game mode helpers
    ├── state.ts            # buildGame, buildAllPlayerStates, getModeDefinition
    ├── initialization.ts   # buildGamePlayers, buildRolesInPlay
    └── modes/
        ├── werewolf/       # Fully app-managed (turn state, phases, 20+ actions)
        ├── secret-villain/ # Fully app-managed (elections, policies, special actions)
        └── avalon/         # Role-distribution stub (no turn state or actions)
```

### `src/lib/game/modes/{mode}/`

Each game mode directory follows a consistent structure:

| File              | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `config.ts`       | `GameModeConfig` — registers the mode with the engine |
| `services.ts`     | `buildInitialTurnState` + `extractPlayerState`        |
| `types.ts`        | Turn state shape, phase enums, mode-specific types    |
| `roles.ts`        | Role definitions, `awareOf` visibility rules          |
| `player-state.ts` | `[Mode]PlayerGameState` interface                     |
| `lobby-config.ts` | Lobby config shape and default factory                |
| `timer-config.ts` | Timer config shape and defaults                       |
| `actions/`        | One file per `GameAction` (`isValid` + `apply`)       |
| `copy.ts`         | All user-facing strings (i18n-ready)                  |
| `themes.ts`       | Cosmetic label variants (Secret Villain only)         |

## `src/server/`

Server-side orchestration. Called from API route handlers. Uses Firebase Admin SDK indirectly through `src/services/`. Nothing here is imported by client components.

```
server/
├── game.ts          # createGame, applyAction, advanceToPlaying, validateGameStartPrerequisites
├── game.spec.ts
├── lobby.ts         # addLobby, startLobbyGame, validatePlayerJoin, authorizePlayerRemoval
├── lobby.spec.ts
├── types/           # Server-facing types: PlayerGameState, PublicLobby, RoleSlot, etc.
└── utils/
    ├── api-helpers.ts      # authenticateLobby, authenticateGame, normalizeDisplayName, playerNameKey, validatePlayerName, errorResponse
    ├── assign-roles.ts     # Role assignment algorithm
    ├── lobby-helpers.ts    # isValidSession, toPublicLobby
    └── role-slots.ts       # adjustRoleSlots, validateRoleSlotsForMode, validateRoleSlotsCoverPlayerCount
```

`server/` is the boundary between route handlers and game logic. Route handlers parse requests and call `server/` functions; `server/` functions orchestrate `lib/` logic and `services/` reads/writes.

## `src/services/`

Firebase Realtime Database reads and writes. All RTDB access goes through this directory — no file outside `services/` may call `getAdminDatabase()` directly.

```
services/
├── game.ts     # saveGame, getGame, writeAllPlayerStates, updateGameStatus, applyStatusTransaction
├── lobby.ts    # addLobby, getLobby, addPlayer, removePlayer, updateConfig, setLobbyGameId, etc.
└── prune.ts    # pruneStaleGames — deletes abandoned lobbies and games
```

Functions here accept and return typed interfaces from `src/lib/types/`. Wire-format conversion happens in `src/lib/firebase/schema/`.

## `src/hooks/`

React hooks for real-time state and server communication.

```
hooks/
├── game.ts          # useGameStateQuery — subscribes to playerState/{sessionId} via Firebase onValue
├── lobby.ts         # useLobbyQuery — subscribes to lobbies/{lobbyId}/public via Firebase onValue
├── lobbySocket.ts   # Lobby real-time update bridge
├── configSync.ts    # Syncs lobby config changes to Redux store
├── firebaseAuth.ts  # useFirebaseAuth — exchanges session for Firebase token
├── gameModeContext.ts # GameMode React context
└── players.ts       # usePlayerList — derived player state
```

Hooks are the client-side entry points to game state. They subscribe to Firebase and expose typed state — components never read from Firebase directly.

## `src/components/`

React UI components. Split by domain.

```
components/
├── RoleLabel.tsx         # Shared role name + team badge
├── ui/                   # ShadCN UI primitives (Button, Card, Badge, etc.)
├── lobby/                # Lobby UI (player list, role config panel, ready button, etc.)
├── game/
│   ├── shared/           # Components shared across game modes
│   ├── werewolf/         # Werewolf phase UIs (night targeting, day trial, etc.)
│   └── secret-villain/   # Secret Villain phase UIs (election, policy, board, etc.)
└── debug/                # Debug game viewer components
```

Game-mode screen components (`WerewolfPlayerScreen`, `SecretVillainPlayerScreen`, etc.) read from `useGameStateQuery`, narrow to the appropriate `[Mode]PlayerGameState` type, and delegate rendering to phase-specific sub-components.

## `src/store/`

Redux Toolkit slices for client-only UI state. Currently used for lobby configuration state that needs to persist across component re-renders without triggering re-fetches.

## `src/test-setup/`

Vitest setup files.

- `firebase-admin-mock.ts` — in-memory Firebase Admin RTDB mock; all server-side tests run against this instead of a real Firebase project
