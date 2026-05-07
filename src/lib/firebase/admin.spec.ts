import { afterEach, describe, it, expect, vi } from "vitest";

// Use the real admin.ts, not the global mock from firebase-admin-mock.ts setupFile
vi.unmock("@/lib/firebase/admin");

// Stub out Firebase Admin SDK to avoid real initialization
vi.mock("firebase-admin/app", () => ({
  getApps: vi.fn(() => []),
  initializeApp: vi.fn(() => ({ name: "[DEFAULT]" })),
  cert: vi.fn(),
}));
vi.mock("firebase-admin/database", () => ({
  getDatabase: vi.fn(() => ({})),
}));
vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({})),
}));

import { getAdminDatabase } from "@/lib/firebase/admin";

const VALID_ENV = {
  FIREBASE_PROJECT_ID: "test-project",
  FIREBASE_CLIENT_EMAIL: "sa@test-project.iam.gserviceaccount.com",
  FIREBASE_DATABASE_URL: "https://test-project.firebaseio.com",
  FIREBASE_PRIVATE_KEY: "-----BEGIN TEST KEY-----",
};

function stubValidEnv(overrides: Record<string, string> = {}) {
  for (const [k, v] of Object.entries({ ...VALID_ENV, ...overrides })) {
    vi.stubEnv(k, v);
  }
}

describe("initAdminApp", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("initializes without throwing when all env vars are valid", () => {
    stubValidEnv();
    expect(() => getAdminDatabase()).not.toThrow();
  });

  describe("FIREBASE_PROJECT_ID", () => {
    it("throws when missing", () => {
      stubValidEnv({ FIREBASE_PROJECT_ID: "" });
      expect(() => getAdminDatabase()).toThrow(
        "[Firebase Admin] FIREBASE_PROJECT_ID is missing or invalid",
      );
    });
  });

  describe("FIREBASE_CLIENT_EMAIL", () => {
    it("throws when missing", () => {
      stubValidEnv({ FIREBASE_CLIENT_EMAIL: "" });
      expect(() => getAdminDatabase()).toThrow(
        "[Firebase Admin] FIREBASE_CLIENT_EMAIL is missing or invalid",
      );
    });

    it("throws when not a service account address", () => {
      stubValidEnv({ FIREBASE_CLIENT_EMAIL: "user@gmail.com" });
      expect(() => getAdminDatabase()).toThrow(
        "[Firebase Admin] FIREBASE_CLIENT_EMAIL is missing or invalid",
      );
    });
  });

  describe("FIREBASE_DATABASE_URL", () => {
    it("throws when missing", () => {
      stubValidEnv({ FIREBASE_DATABASE_URL: "" });
      expect(() => getAdminDatabase()).toThrow(
        "[Firebase Admin] FIREBASE_DATABASE_URL is missing or invalid",
      );
    });
  });

  describe("FIREBASE_PRIVATE_KEY", () => {
    it("throws when missing", () => {
      stubValidEnv({ FIREBASE_PRIVATE_KEY: "" });
      expect(() => getAdminDatabase()).toThrow(
        "[Firebase Admin] FIREBASE_PRIVATE_KEY is missing or invalid",
      );
    });

    it("throws when present but not a PEM key", () => {
      stubValidEnv({ FIREBASE_PRIVATE_KEY: "not-a-key" });
      expect(() => getAdminDatabase()).toThrow(
        "[Firebase Admin] FIREBASE_PRIVATE_KEY is missing or invalid",
      );
    });
  });
});
