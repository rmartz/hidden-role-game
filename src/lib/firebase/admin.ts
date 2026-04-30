import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getAuth } from "firebase-admin/auth";

function initAdminApp() {
  const existing = getApps().find((a) => a.name === "[DEFAULT]");
  if (existing) return existing;

  const privateKey = process.env["FIREBASE_PRIVATE_KEY"]?.replace(/\\n/g, "\n");
  if (!privateKey?.startsWith("-----BEGIN")) {
    throw new Error(
      `[Firebase Admin] FIREBASE_PRIVATE_KEY is missing or malformed — value does not start with "-----BEGIN". Check Vercel environment variables.`,
    );
  }

  return initializeApp({
    credential: cert({
      projectId: process.env["FIREBASE_PROJECT_ID"],
      clientEmail: process.env["FIREBASE_CLIENT_EMAIL"],
      privateKey,
    }),
    databaseURL: process.env["FIREBASE_DATABASE_URL"],
  });
}

export function getAdminDatabase() {
  initAdminApp();
  return getDatabase();
}

export function getAdminAuth() {
  initAdminApp();
  return getAuth();
}
