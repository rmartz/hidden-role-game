"use client";

import { useEffect, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { getSessionId } from "@/lib/api";

// Module-level deduplication: only one sign-in attempt at a time.
let signInPromise: Promise<void> | null = null;

async function doSignIn(): Promise<void> {
  const auth = getClientAuth();
  if (auth.currentUser) return;
  const sessionId = getSessionId();
  if (!sessionId) return;
  const res = await fetch("/api/auth/firebase-token", {
    method: "POST",
    headers: { "x-session-id": sessionId },
  });
  if (!res.ok) throw new Error(`Token fetch failed: ${String(res.status)}`);
  const { token } = (await res.json()) as { token: string };
  await signInWithCustomToken(auth, token);
}

function ensureSignedIn(): Promise<void> {
  signInPromise ??= doSignIn().catch((err: unknown) => {
    // Reset so the next caller can retry.
    signInPromise = null;
    throw err;
  });
  return signInPromise;
}

/**
 * Ensures the Firebase client SDK is authenticated with a custom token tied
 * to the current session ID. Returns `isReady` once signed in.
 */
export function useFirebaseAuth(): { isReady: boolean } {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureSignedIn()
      .then(() => {
        if (!cancelled) setIsReady(true);
      })
      .catch((err: unknown) => {
        console.error("[useFirebaseAuth] Sign-in failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { isReady };
}
