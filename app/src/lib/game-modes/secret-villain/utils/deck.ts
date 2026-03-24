import { PolicyCard, DECK_GOOD_CARDS, DECK_BAD_CARDS } from "../types";

/** Minimum cards required in the deck before a draw. Below this, reshuffle. */
const MIN_DECK_SIZE = 3;

/** Fisher-Yates shuffle (in-place, returns the same array). */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i] as T;
    array[i] = array[j] as T;
    array[j] = temp;
  }
  return array;
}

/** Creates a fresh shuffled deck with the standard card distribution. */
export function createDeck(): PolicyCard[] {
  const cards: PolicyCard[] = [
    ...Array.from<PolicyCard>({ length: DECK_GOOD_CARDS }).fill(
      PolicyCard.Good,
    ),
    ...Array.from<PolicyCard>({ length: DECK_BAD_CARDS }).fill(PolicyCard.Bad),
  ];
  return shuffle(cards);
}

/**
 * Draws `count` cards from the top of the deck.
 * Returns the drawn cards and the remaining deck.
 * Throws if the deck has fewer cards than requested.
 */
export function drawCards(
  deck: PolicyCard[],
  count: number,
): { drawn: PolicyCard[]; remaining: PolicyCard[] } {
  if (deck.length < count) {
    throw new Error(
      `Cannot draw ${String(count)} cards from a deck of ${String(deck.length)}`,
    );
  }
  return {
    drawn: deck.slice(0, count),
    remaining: deck.slice(count),
  };
}

/**
 * If the deck has fewer than 3 cards, combines it with the discard pile
 * and reshuffles. Otherwise returns the deck and discard pile unchanged.
 */
export function reshuffleIfNeeded(
  deck: PolicyCard[],
  discardPile: PolicyCard[],
): { deck: PolicyCard[]; discardPile: PolicyCard[] } {
  if (deck.length >= MIN_DECK_SIZE) {
    return { deck, discardPile };
  }
  return {
    deck: shuffle([...deck, ...discardPile]),
    discardPile: [],
  };
}
