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
  if (
    typeof body !== "object" ||
    body === null ||
    !("playerOrder" in body) ||
    !Array.isArray((body as Record<string, unknown>).playerOrder) ||
    !(body as Record<string, unknown[]>).playerOrder.every(
      (v) => typeof v === "string",
    )
  ) {
    return {
      valid: false,
      error: "playerOrder must be an array of strings",
      status: 400,
    };
  }

  const playerOrder = (body as Record<string, string[]>).playerOrder;
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
