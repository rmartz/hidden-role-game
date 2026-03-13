"use client";

import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env["NEXT_PUBLIC_FIREBASE_API_KEY"],
  authDomain: process.env["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"],
  projectId: process.env["NEXT_PUBLIC_FIREBASE_PROJECT_ID"],
  databaseURL: process.env["NEXT_PUBLIC_FIREBASE_DATABASE_URL"],
};

function getClientApp() {
  return (
    getApps().find((a) => a.name === "[DEFAULT]") ??
    initializeApp(firebaseConfig)
  );
}

export function getClientDatabase() {
  return getDatabase(getClientApp());
}

export function getClientAuth() {
  return getAuth(getClientApp());
}
