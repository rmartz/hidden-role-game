/**
 * In-memory Firebase Admin Database mock for Vitest.
 * Provides a minimal implementation of the RTDB reference API used by
 * FirebaseLobbyService and FirebaseGameService.
 */

import { vi, beforeEach } from "vitest";

// In-memory store — reset before each test
let store: Record<string, unknown> = {};

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path) return obj;
  const parts = path.split("/").filter(Boolean);
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function setNestedValue(path: string, value: unknown): void {
  if (!path) {
    store = (value ?? {}) as Record<string, unknown>;
    return;
  }
  const parts = path.split("/").filter(Boolean);
  let current: Record<string, unknown> = store;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!part) continue;
    if (current[part] == null || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  const last = parts.at(-1);
  if (!last) return;
  if (value === null || value === undefined) {
    const remaining = Object.fromEntries(
      Object.entries(current).filter(([k]) => k !== last),
    );
    for (const key of Object.keys(current)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete current[key];
    }
    Object.assign(current, remaining);
  } else {
    current[last] = value;
  }
}

function makeSnapshot(path: string) {
  const value = getNestedValue(store, path);
  return {
    exists: () => value !== undefined && value !== null,
    val: () => value ?? null,
  };
}

function makeRef(path: string): Record<string, unknown> {
  return {
    once: vi.fn(() => Promise.resolve(makeSnapshot(path))),
    set: vi.fn((value: unknown) => {
      setNestedValue(path, value);
      return Promise.resolve();
    }),
    update: vi.fn((updates: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(updates)) {
        const fullPath = path ? `${path}/${key}` : key;
        setNestedValue(fullPath, value);
      }
      return Promise.resolve();
    }),
    remove: vi.fn(() => {
      setNestedValue(path, null);
      return Promise.resolve();
    }),
    child: (childPath: string) =>
      makeRef(path ? `${path}/${childPath}` : childPath),
    ref: (childPath?: string) => (childPath ? makeRef(childPath) : makeRef("")),
  };
}

const mockDatabase = {
  ref: (path?: string) => makeRef(path ?? ""),
};

beforeEach(() => {
  store = {};
});

vi.mock("@/lib/firebase/admin", () => ({
  getAdminDatabase: () => mockDatabase,
}));
