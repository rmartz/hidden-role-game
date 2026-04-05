import type {
  Lobby,
  GameMode,
  ModeConfig,
  RoleSlot,
  RoleConfigMode,
  ShowRolesInPlay,
} from "@/lib/types";
import { modeConfigToFirebase } from "@/lib/firebase/schema";
import { getAdminDatabase } from "@/lib/firebase/admin";
import { ServerValue } from "firebase-admin/database";
import {
  lobbyToFirebase,
  firebaseToLobby,
  type FirebaseLobbyPublic,
  type FirebaseLobbyPrivate,
} from "@/lib/firebase/schema";

function lobbyRef(lobbyId: string) {
  return getAdminDatabase().ref(`lobbies/${lobbyId}`);
}

export class FirebaseLobbyService {
  async addLobby(lobby: Lobby): Promise<void> {
    const { public: pub, private: priv } = lobbyToFirebase(lobby);
    await lobbyRef(lobby.id).set({
      public: { ...pub, createdAt: ServerValue.TIMESTAMP },
      private: priv,
    });
  }

  async getLobby(lobbyId: string): Promise<Lobby | undefined> {
    const snap = await lobbyRef(lobbyId).once("value");
    if (!snap.exists()) return undefined;
    const data = snap.val() as {
      public: FirebaseLobbyPublic;
      private: FirebaseLobbyPrivate;
    };
    return firebaseToLobby(lobbyId, data.public, data.private);
  }

  async clearGameId(lobbyId: string): Promise<Lobby | undefined> {
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

  async setGameId(lobbyId: string, gameId: string): Promise<Lobby | undefined> {
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

  async transferOwner(
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

  async removePlayer(
    lobbyId: string,
    playerId: string,
  ): Promise<Lobby | undefined> {
    const snap = await lobbyRef(lobbyId).once("value");
    if (!snap.exists()) return undefined;

    const data = snap.val() as {
      public: FirebaseLobbyPublic;
      private: FirebaseLobbyPrivate;
    };

    await lobbyRef(lobbyId).update({
      [`public/players/${playerId}`]: null,
      [`private/playerSessions/${playerId}`]: null,
    });

    data.public.players = Object.fromEntries(
      Object.entries(data.public.players ?? {}).filter(
        ([id]) => id !== playerId,
      ),
    );
    data.private.playerSessions = Object.fromEntries(
      Object.entries(data.private.playerSessions ?? {}).filter(
        ([id]) => id !== playerId,
      ),
    );
    return firebaseToLobby(lobbyId, data.public, data.private);
  }

  async addPlayer(
    lobbyId: string,
    player: { id: string; name: string; sessionId: string },
  ): Promise<Lobby | undefined> {
    const snap = await lobbyRef(lobbyId).once("value");
    if (!snap.exists()) return undefined;

    const data = snap.val() as {
      public: FirebaseLobbyPublic;
      private: FirebaseLobbyPrivate;
    };

    await lobbyRef(lobbyId).update({
      [`public/players/${player.id}`]: { id: player.id, name: player.name },
      [`private/playerSessions/${player.id}`]: player.sessionId,
    });

    (data.public.players ??= {})[player.id] = {
      id: player.id,
      name: player.name,
    };
    (data.private.playerSessions ??= {})[player.id] = player.sessionId;
    return firebaseToLobby(lobbyId, data.public, data.private);
  }

  async toggleReady(
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

  async clearReadyPlayerIds(lobbyId: string): Promise<void> {
    await lobbyRef(lobbyId).child("public/readyPlayerIds").remove();
  }

  async updateConfig(
    lobbyId: string,
    config: {
      showConfigToPlayers?: boolean;
      showRolesInPlay?: ShowRolesInPlay;
      roleConfigMode?: RoleConfigMode;
      gameMode?: GameMode;
      roleSlots?: RoleSlot[];
      timerConfig?: import("@/lib/types").TimerConfig;
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
}

declare global {
  var firebaseLobbyServiceInstance: FirebaseLobbyService | undefined;
}

export const lobbyService: FirebaseLobbyService =
  globalThis.firebaseLobbyServiceInstance ??
  (globalThis.firebaseLobbyServiceInstance = new FirebaseLobbyService());
