import { describe, it, expect } from "vitest";
import { PolicyCard, DECK_GOOD_CARDS, DECK_BAD_CARDS } from "../types";
import { createDeck, drawCards, reshuffleIfNeeded } from "./deck";

describe("createDeck", () => {
  it("creates a deck with the correct total card count", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(DECK_GOOD_CARDS + DECK_BAD_CARDS);
  });

  it("contains the correct number of Good cards", () => {
    const deck = createDeck();
    const goodCount = deck.filter((c) => c === PolicyCard.Good).length;
    expect(goodCount).toBe(DECK_GOOD_CARDS);
  });

  it("contains the correct number of Bad cards", () => {
    const deck = createDeck();
    const badCount = deck.filter((c) => c === PolicyCard.Bad).length;
    expect(badCount).toBe(DECK_BAD_CARDS);
  });
});

describe("drawCards", () => {
  it("returns the requested number of drawn cards", () => {
    const deck = [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Good];
    const { drawn } = drawCards(deck, 2);
    expect(drawn).toEqual([PolicyCard.Good, PolicyCard.Bad]);
  });

  it("returns the remaining deck after drawing", () => {
    const deck = [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Good];
    const { remaining } = drawCards(deck, 2);
    expect(remaining).toEqual([PolicyCard.Good]);
  });

  it("draws from the top of the deck", () => {
    const deck = [PolicyCard.Bad, PolicyCard.Good, PolicyCard.Bad];
    const { drawn } = drawCards(deck, 1);
    expect(drawn).toEqual([PolicyCard.Bad]);
  });

  it("does not mutate the original deck", () => {
    const deck = [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Good];
    const original = [...deck];
    drawCards(deck, 2);
    expect(deck).toEqual(original);
  });

  it("throws when drawing more cards than available", () => {
    const deck = [PolicyCard.Good];
    expect(() => drawCards(deck, 2)).toThrow(
      "Cannot draw 2 cards from a deck of 1",
    );
  });

  it("returns empty remaining when drawing all cards", () => {
    const deck = [PolicyCard.Good, PolicyCard.Bad];
    const { drawn, remaining } = drawCards(deck, 2);
    expect(drawn).toHaveLength(2);
    expect(remaining).toHaveLength(0);
  });
});

describe("reshuffleIfNeeded", () => {
  it("does not reshuffle when deck has 3 or more cards", () => {
    const deck = [PolicyCard.Good, PolicyCard.Bad, PolicyCard.Good];
    const discardPile = [PolicyCard.Bad, PolicyCard.Bad];
    const result = reshuffleIfNeeded(deck, discardPile);
    expect(result.deck).toEqual(deck);
    expect(result.discardPile).toEqual(discardPile);
  });

  it("reshuffles when deck has fewer than 3 cards", () => {
    const deck = [PolicyCard.Good, PolicyCard.Bad];
    const discardPile = [PolicyCard.Bad, PolicyCard.Good, PolicyCard.Bad];
    const result = reshuffleIfNeeded(deck, discardPile);
    expect(result.deck).toHaveLength(5);
    expect(result.discardPile).toEqual([]);
  });

  it("reshuffles when deck is empty", () => {
    const deck: PolicyCard[] = [];
    const discardPile = [PolicyCard.Good, PolicyCard.Bad];
    const result = reshuffleIfNeeded(deck, discardPile);
    expect(result.deck).toHaveLength(2);
    expect(result.discardPile).toEqual([]);
  });

  it("preserves total card count across reshuffle", () => {
    const deck = [PolicyCard.Good];
    const discardPile = [
      PolicyCard.Bad,
      PolicyCard.Bad,
      PolicyCard.Good,
      PolicyCard.Good,
    ];
    const result = reshuffleIfNeeded(deck, discardPile);
    expect(result.deck).toHaveLength(5);
    const goodCount = result.deck.filter((c) => c === PolicyCard.Good).length;
    const badCount = result.deck.filter((c) => c === PolicyCard.Bad).length;
    expect(goodCount).toBe(3);
    expect(badCount).toBe(2);
  });

  it("handles reshuffle with empty discard pile", () => {
    const deck = [PolicyCard.Good];
    const discardPile: PolicyCard[] = [];
    const result = reshuffleIfNeeded(deck, discardPile);
    expect(result.deck).toHaveLength(1);
    expect(result.discardPile).toEqual([]);
  });
});
