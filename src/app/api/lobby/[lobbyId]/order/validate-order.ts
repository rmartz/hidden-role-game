interface ValidOrderResult {
  valid: true;
  playerOrder: string[];
}

interface InvalidOrderResult {
  valid: false;
  error: string;
  status: 400;
}

type ValidateOrderResult = ValidOrderResult | InvalidOrderResult;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

/**
 * Parses and validates a raw request body against the current lobby player IDs.
 *
 * Returns `{ valid: true, playerOrder }` on success, or
 * `{ valid: false, error, status }` on any validation failure.
 */
export function validatePlayerOrder(
  body: unknown,
  lobbyPlayers: { id: string }[],
): ValidateOrderResult {
  const rawOrder =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)["playerOrder"]
      : undefined;

  if (!isStringArray(rawOrder)) {
    return {
      valid: false,
      error: "playerOrder must be an array of strings",
      status: 400,
    };
  }

  const playerOrder = rawOrder;
  const lobbyPlayerIds = new Set(lobbyPlayers.map((p) => p.id));
  const orderIds = new Set(playerOrder);

  if (
    playerOrder.length !== lobbyPlayers.length ||
    [...lobbyPlayerIds].some((id) => !orderIds.has(id))
  ) {
    return {
      valid: false,
      error: "playerOrder must contain exactly all current player IDs",
      status: 400,
    };
  }

  return { valid: true, playerOrder };
}
