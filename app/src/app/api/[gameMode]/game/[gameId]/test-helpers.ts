import { POST as createLobby } from "../../../lobby/create/route";
import { POST as joinLobby } from "../../../lobby/[lobbyId]/join/route";
import { PUT as updateConfig } from "../../../lobby/[lobbyId]/config/route";
import { POST as startGame } from "../create/route";
import {
  postRequest,
  makeLobbyParams,
  makeCreateGameParams,
} from "@/app/api/test-utils";

export async function setupStartedSecretVillainGame() {
  const createRes = await createLobby(
    postRequest("http://localhost/api/lobby/create", { playerName: "Alice" }),
  );
  const { data: createData } = (await createRes.json()) as {
    data: { lobby: { id: string }; sessionId: string };
  };
  const { lobby, sessionId: aliceSession } = createData;

  const joinRes = await joinLobby(
    postRequest(`http://localhost/api/lobby/${lobby.id}/join`, {
      playerName: "Bob",
    }),
    makeLobbyParams(lobby.id),
  );
  const { data: joinData } = (await joinRes.json()) as {
    data: { sessionId: string };
  };

  await updateConfig(
    new Request(`http://localhost/api/lobby/${lobby.id}/config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": aliceSession,
      },
      body: JSON.stringify({
        roleSlots: [
          { roleId: "good", min: 1, max: 1 },
          { roleId: "bad", min: 1, max: 1 },
        ],
      }),
    }),
    makeLobbyParams(lobby.id),
  );

  const startRes = await startGame(
    new Request("http://localhost/api/secret-villain/game/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": aliceSession,
      },
      body: JSON.stringify({ lobbyId: lobby.id }),
    }),
    makeCreateGameParams("secret-villain"),
  );
  const { data: startData } = (await startRes.json()) as {
    data: { lobby: { gameId: string } };
  };

  return {
    gameId: startData.lobby.gameId,
    aliceSession,
    bobSession: joinData.sessionId,
  };
}
