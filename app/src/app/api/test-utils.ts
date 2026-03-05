export function postRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function makeLobbyParams(lobbyId: string) {
  return { params: Promise.resolve({ lobbyId }) };
}

export function makePlayerParams(lobbyId: string, playerId: string) {
  return { params: Promise.resolve({ lobbyId, playerId }) };
}

export function makeGameParams(gameId: string) {
  return { params: Promise.resolve({ gameId }) };
}
