import { describe, it, expect } from "vitest";
import { normalizePlayerName, validatePlayerName } from "./api-helpers";

describe("validatePlayerName", () => {
  it("returns undefined for a valid name", () => {
    expect(validatePlayerName("Alice")).toBeUndefined();
  });

  it("returns an error for an empty name", () => {
    expect(validatePlayerName("")).toBeDefined();
  });

  it.each([
    [" ", "space"],
    ["   ", "multiple spaces"],
    ["\t", "tab"],
    ["\t\t", "multiple tabs"],
    ["\n", "newline"],
    ["\r\n", "CRLF"],
    ["\u00A0", "non-breaking space"],
    [" \t\n\u00A0 ", "mixed whitespace"],
  ])("returns an error for a whitespace-only name (%s)", (name) => {
    expect(validatePlayerName(name)).toBeDefined();
  });

  it("returns an error for a name that is too long", () => {
    expect(validatePlayerName("a".repeat(33))).toBeDefined();
  });

  it("accepts a name at the maximum length", () => {
    expect(validatePlayerName("a".repeat(32))).toBeUndefined();
  });

  it.each(["<script>", "foo&bar", 'say "hi"', "{json}", "[arr]"])(
    "returns an error for name containing invalid chars: %s",
    (name) => {
      expect(validatePlayerName(name)).toBeDefined();
    },
  );

  it("allows international characters", () => {
    expect(validatePlayerName("Ångström")).toBeUndefined();
    expect(validatePlayerName("O'Brien")).toBeUndefined();
    expect(validatePlayerName("José-María")).toBeUndefined();
  });
});

describe("normalizePlayerName", () => {
  it("lowercases the name", () => {
    expect(normalizePlayerName("Alice")).toBe("alice");
    expect(normalizePlayerName("ALICE")).toBe("alice");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizePlayerName("  Alice  ")).toBe("alice");
  });

  it("collapses internal whitespace runs to a single space", () => {
    expect(normalizePlayerName("Alice  Bob")).toBe("alice bob");
    expect(normalizePlayerName("Alice\t\tBob")).toBe("alice bob");
  });

  it("applies Unicode NFC normalization", () => {
    const composed = "\u00e9"; // é as single codepoint
    const decomposed = "e\u0301"; // e + combining accent
    expect(normalizePlayerName(`caf${composed}`)).toBe(
      normalizePlayerName(`caf${decomposed}`),
    );
  });

  it("two names that differ only by case or whitespace normalize to the same value", () => {
    expect(normalizePlayerName("Alice")).toBe(normalizePlayerName("alice"));
    expect(normalizePlayerName(" alice ")).toBe(normalizePlayerName("Alice"));
    expect(normalizePlayerName("Alice  Bob")).toBe(
      normalizePlayerName("Alice Bob"),
    );
  });
});
