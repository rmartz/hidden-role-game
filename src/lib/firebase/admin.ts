import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getAuth } from "firebase-admin/auth";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[Firebase Admin] ${name} is missing or invalid. Check Vercel environment variables.`,
    );
  }
  return value;
}

function initAdminApp() {
  const existing = getApps().find((a) => a.name === "[DEFAULT]");
  if (existing) return existing;

  const projectId = requireEnv("FIREBASE_PROJECT_ID");
  const clientEmail = requireEnv("FIREBASE_CLIENT_EMAIL");
  const databaseURL = requireEnv("FIREBASE_DATABASE_URL");

  const rawPrivateKey = requireEnv("FIREBASE_PRIVATE_KEY");
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
  if (!privateKey.startsWith("-----BEGIN")) {
    throw new Error(
      `[Firebase Admin] FIREBASE_PRIVATE_KEY is missing or invalid — value does not start with "-----BEGIN". Check Vercel environment variables.`,
    );
  }

  if (
    !clientEmail.includes("@") ||
    !clientEmail.endsWith(".iam.gserviceaccount.com")
  ) {
    throw new Error(
      `[Firebase Admin] FIREBASE_CLIENT_EMAIL is missing or invalid — expected a service account address ending in .iam.gserviceaccount.com. Check Vercel environment variables.`,
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL,
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
