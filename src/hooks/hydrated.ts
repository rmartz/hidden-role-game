"use client";

import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => undefined;
}

/**
 * Returns false during server rendering and hydration, true afterwards.
 * Gate reads of browser-only state (localStorage, sessionStorage) on it so the
 * hydration render matches the server HTML.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
