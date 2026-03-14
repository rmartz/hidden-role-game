"use client";

import { useEffect, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { getSessionId } from "@/lib/api";

// Module-level deduplication: only one sign-in attempt at a time.
let signInPromise: Promise<void> | null = null;
let signedInSessionId: string | null = null;

async function doSignIn(): Promise<void> {
  const auth = getClientAuth();
  const sessionId = getSessionId();
  if (!sessionId) return;

  // Already authenticated as this session.
  if (auth.currentUser && signedInSessionId === sessionId) return;

  const res = await fetch("/api/auth/firebase-token", {
    method: "POST",
    headers: { "x-session-id": sessionId },
  });
  if (!res.ok) throw new Error(`Token fetch failed: ${String(res.status)}`);
  const { token } = (await res.json()) as { token: string };
  await signInWithCustomToken(auth, token);
  signedInSessionId = sessionId;
}

function ensureSignedIn(): Promise<void> {
  const sessionId = getSessionId();
  // Invalidate cached promise if the session changed.
  if (signedInSessionId !== sessionId) {
    signInPromise = null;
  }
  signInPromise ??= doSignIn().catch((err: unknown) => {
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
    setIsReady(false);
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
