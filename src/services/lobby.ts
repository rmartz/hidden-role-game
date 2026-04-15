import type {
  Lobby,
  GameMode,
  ModeConfig,
  RoleBucket,
  RoleSlot,
  RoleConfigMode,
  ShowRolesInPlay,
  TimerConfig,
} from "@/lib/types";
import { getAdminDatabase } from "@/lib/firebase/admin";
import { ServerValue } from "firebase-admin/database";
import {
  modeConfigToFirebase,
  lobbyToFirebase,
  firebaseToLobby,
  type FirebaseLobbyPublic,
  type FirebaseLobbyPrivate,
  type FirebaseRoleBucket,
} from "@/lib/firebase/schema";
import { resolvePlayerOrder } from "@/lib/player-order";

function lobbyRef(lobbyId: string) {
  return getAdminDatabase().ref(`lobbies/${lobbyId}`);
}

export async function addLobby(lobby: Lobby): Promise<void> {
  const { public: pub, private: priv } = lobbyToFirebase(lobby);
  await lobbyRef(lobby.id).set({
    public: { ...pub, createdAt: ServerValue.TIMESTAMP },
    private: priv,
  });
}

export async function getLobby(lobbyId: string): Promise<Lobby | undefined> {
  const snap = await lobbyRef(lobbyId).once("value");
  if (!snap.exists()) return undefined;
  const data = snap.val() as {
    public: FirebaseLobbyPublic;
    private: FirebaseLobbyPrivate;
  };
  return firebaseToLobby(lobbyId, data.public, data.private);
}

export async function clearGameId(lobbyId: string): Promise<Lobby | undefined> {
  const snap = await lobbyRef(lobbyId).once("value");
  if (!snap.exists()) return undefined;

  await lobbyRef(lobbyId).child("public/gameId").remove();

  const data = snap.val() as {
    public: FirebaseLobbyPublic;
    private: FirebaseLobbyPrivate;
  };
  data.public.gameId = null;
  return firebaseToLobby(lobbyId, data.public, data.private);
}

export async function setLobbyGameId(
  lobbyId: string,
  gameId: string,
): Promise<Lobby | undefined> {
  const ref = lobbyRef(lobbyId);
  const snap = await ref.once("value");
  if (!snap.exists()) return undefined;

  await ref.child("public/gameId").set(gameId);

  const updated = snap.val() as {
    public: FirebaseLobbyPublic;
    private: FirebaseLobbyPrivate;
  };
  updated.public.gameId = gameId;
  return firebaseToLobby(lobbyId, updated.public, updated.private);
}

export async function transferOwner(
  lobbyId: string,
  targetPlayerId: string,
): Promise<Lobby | undefined> {
  const snap = await lobbyRef(lobbyId).once("value");
  if (!snap.exists()) return undefined;

  const data = snap.val() as {
    public: FirebaseLobbyPublic;
    private: FirebaseLobbyPrivate;
  };

  const newSessionId = data.private.playerSessions?.[targetPlayerId];
  if (!newSessionId) return undefined;

  await lobbyRef(lobbyId).update({
    "private/ownerSessionId": newSessionId,
    "public/ownerPlayerId": targetPlayerId,
  });

  data.private.ownerSessionId = newSessionId;
  data.public.ownerPlayerId = targetPlayerId;
  return firebaseToLobby(lobbyId, data.public, data.private);
}

export async function removePlayer(
  lobbyId: string,
  playerId: string,
): Promise<Lobby | undefined> {
  const snap = await lobbyRef(lobbyId).once("value");
  if (!snap.exists()) return undefined;

  const data = snap.val() as {
    public: FirebaseLobbyPublic;
    private: FirebaseLobbyPrivate;
  };

  const remainingPlayerIds = Object.keys(data.public.players ?? {}).filter(
    (id) => id !== playerId,
  );
  const updatedOrder = resolvePlayerOrder(
    data.public.playerOrder,
    remainingPlayerIds,
  );

  await lobbyRef(lobbyId).update({
    [`public/players/${playerId}`]: null,
    [`private/playerSessions/${playerId}`]: null,
    "public/playerOrder": updatedOrder.length > 0 ? updatedOrder : null,
  });

  data.public.players = Object.fromEntries(
    Object.entries(data.public.players ?? {}).filter(([id]) => id !== playerId),
  );
  data.private.playerSessions = Object.fromEntries(
    Object.entries(data.private.playerSessions ?? {}).filter(
      ([id]) => id !== playerId,
    ),
  );
  data.public.playerOrder = updatedOrder.length > 0 ? updatedOrder : undefined;
  return firebaseToLobby(lobbyId, data.public, data.private);
}

export async function addPlayer(
  lobbyId: string,
  player: { id: string; name: string; sessionId: string },
): Promise<Lobby | undefined> {
  const snap = await lobbyRef(lobbyId).once("value");
  if (!snap.exists()) return undefined;

  const data = snap.val() as {
    public: FirebaseLobbyPublic;
    private: FirebaseLobbyPrivate;
  };

  const existingPlayerIds = Object.keys(data.public.players ?? {});
  const updatedOrder = [
    ...resolvePlayerOrder(data.public.playerOrder, existingPlayerIds),
    player.id,
  ];

  await lobbyRef(lobbyId).update({
    [`public/players/${player.id}`]: { id: player.id, name: player.name },
    [`private/playerSessions/${player.id}`]: player.sessionId,
    "public/playerOrder": updatedOrder,
  });

  (data.public.players ??= {})[player.id] = {
    id: player.id,
    name: player.name,
  };
  (data.private.playerSessions ??= {})[player.id] = player.sessionId;
  data.public.playerOrder = updatedOrder;
  return firebaseToLobby(lobbyId, data.public, data.private);
}

export async function toggleReady(
  lobbyId: string,
  playerId: string,
): Promise<Lobby | undefined> {
  const snap = await lobbyRef(lobbyId).once("value");
  if (!snap.exists()) return undefined;

  const data = snap.val() as {
    public: FirebaseLobbyPublic;
    private: FirebaseLobbyPrivate;
  };

  const current: string[] = data.public.readyPlayerIds ?? [];
  const isReady = current.includes(playerId);
  const updated = isReady
    ? current.filter((id) => id !== playerId)
    : [...current, playerId];

  await lobbyRef(lobbyId)
    .child("public/readyPlayerIds")
    .set(updated.length > 0 ? updated : null);

  data.public.readyPlayerIds = updated.length > 0 ? updated : undefined;
  return firebaseToLobby(lobbyId, data.public, data.private);
}

export async function clearReadyPlayerIds(lobbyId: string): Promise<void> {
  await lobbyRef(lobbyId).child("public/readyPlayerIds").remove();
}

export async function updateConfig(
  lobbyId: string,
  config: {
    showConfigToPlayers?: boolean;
    showRolesInPlay?: ShowRolesInPlay;
    roleConfigMode?: RoleConfigMode;
    gameMode?: GameMode;
    roleSlots?: RoleSlot[];
    roleBuckets?: RoleBucket[];
    timerConfig?: TimerConfig;
    modeConfig?: ModeConfig;
  },
): Promise<Lobby | undefined> {
  const snap = await lobbyRef(lobbyId).once("value");
  if (!snap.exists()) return undefined;

  const data = snap.val() as {
    public: FirebaseLobbyPublic;
    private: FirebaseLobbyPrivate;
  };

  const updates: Record<string, unknown> = {};
  if (config.showConfigToPlayers !== undefined) {
    updates["public/config/showConfigToPlayers"] = config.showConfigToPlayers;
    data.public.config.showConfigToPlayers = config.showConfigToPlayers;
  }
  if (config.showRolesInPlay !== undefined) {
    updates["public/config/showRolesInPlay"] = config.showRolesInPlay;
    data.public.config.showRolesInPlay = config.showRolesInPlay;
  }
  if (config.roleConfigMode !== undefined) {
    updates["public/config/roleConfigMode"] = config.roleConfigMode;
    data.public.config.roleConfigMode = config.roleConfigMode;
  }
  if (
    config.gameMode !== undefined &&
    (config.gameMode as string) !== data.public.config.gameMode
  ) {
    updates["public/config/gameMode"] = config.gameMode;
    data.public.config.gameMode = config.gameMode;
  }
  if (config.roleSlots !== undefined) {
    const slots = config.roleSlots.map((s) => ({
      roleId: s.roleId,
      min: s.min,
      max: s.max,
    }));
    updates["public/config/roleSlots"] = slots;
    data.public.config.roleSlots = slots;
  }
  if (config.roleBuckets !== undefined) {
    const buckets: Record<string, FirebaseRoleBucket> = {};
    config.roleBuckets.forEach((bucket, i) => {
      const roles: Record<
        string,
        { roleId: string; min: number; max?: number }
      > = {};
      bucket.roles.forEach((slot, j) => {
        roles[String(j)] = {
          roleId: slot.roleId,
          min: slot.min,
          ...(slot.max !== undefined ? { max: slot.max } : {}),
        };
      });
      buckets[String(i)] = { playerCount: bucket.playerCount, roles };
    });
    updates["public/config/roleBuckets"] =
      config.roleBuckets.length > 0 ? buckets : null;
    data.public.config.roleBuckets =
      config.roleBuckets.length > 0 ? buckets : undefined;
  }
  if (config.timerConfig !== undefined) {
    updates["public/config/timerConfig"] = config.timerConfig;
    data.public.config.timerConfig = config.timerConfig;
  }
  if (config.modeConfig !== undefined) {
    const firebaseModeConfig = modeConfigToFirebase(config.modeConfig);
    updates["public/config/modeConfig"] = firebaseModeConfig;
    data.public.config.modeConfig = firebaseModeConfig;
  }

  if (Object.keys(updates).length > 0) {
    await lobbyRef(lobbyId).update(updates);
  }

  return firebaseToLobby(lobbyId, data.public, data.private);
}

/**
 * Persists a new player ordering for a lobby. The provided `playerOrder` must
 * contain exactly the IDs of all current lobby players. Returns the updated
 * lobby, or undefined if the lobby does not exist.
 */
export async function reorderPlayers(
  lobbyId: string,
  playerOrder: string[],
): Promise<Lobby | undefined> {
  const snap = await lobbyRef(lobbyId).once("value");
  if (!snap.exists()) return undefined;

  const data = snap.val() as {
    public: FirebaseLobbyPublic;
    private: FirebaseLobbyPrivate;
  };

  const currentPlayerIds = Object.keys(data.public.players ?? {});
  const reconciledOrder = resolvePlayerOrder(playerOrder, currentPlayerIds);

  await lobbyRef(lobbyId)
    .child("public/playerOrder")
    .set(reconciledOrder.length > 0 ? reconciledOrder : null);

  data.public.playerOrder =
    reconciledOrder.length > 0 ? reconciledOrder : undefined;
  return firebaseToLobby(lobbyId, data.public, data.private);
}
