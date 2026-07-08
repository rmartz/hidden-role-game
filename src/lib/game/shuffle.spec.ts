import { describe, expect, it } from "vitest";

import { shuffle } from "./shuffle";

describe("shuffle", () => {
  it("returns a new array without mutating the input", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).not.toBe(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it("preserves every element of the input", () => {
    const input = ["a", "b", "c", "d"];
    expect([...shuffle(input)].sort()).toEqual(["a", "b", "c", "d"]);
  });
});
