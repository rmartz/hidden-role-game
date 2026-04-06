# Service Layer Directives

Rules specific to Firebase services, Realtime Database queries, and data access functions.

## Data Access

- All Firebase RTDB reads and writes must go through functions in this directory.
- No file outside this directory may import from `firebase-admin/database` or call `getAdminDatabase()` directly. All database access goes through this directory.
- Each domain gets its own service file (e.g., `lobby.ts`, `game.ts`).

## Database Schema

RTDB is a flat JSON tree organized at top-level paths:

```
lobbies/{lobbyId}/public          # World-readable lobby data (players, config, gameId)
lobbies/{lobbyId}/private         # ownerSessionId + playerSessions map
games/{gameId}/public             # Game metadata and status
games/{gameId}/playerState/{sid}  # Pre-computed PlayerGameState per session
games/{gameId}/sessionIndex/{sid} # Maps sessionId → playerId
```

## Types

- Service functions must accept and return typed interfaces from `src/lib/types/`, never raw Firebase data.
- Conversion between typed interfaces and Firebase wire format happens via helpers in `src/lib/firebase/schema/`. These are the only files that may reference raw Firebase data shapes.
- Infrastructure (Admin SDK initialization, client SDK initialization) stays in `src/lib/firebase/`.
