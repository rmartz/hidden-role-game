import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useIsHydrated } from "./hydrated";

describe("useIsHydrated", () => {
  afterEach(cleanup);

  it("returns true once rendered on the client", () => {
    const { result } = renderHook(() => useIsHydrated());
    expect(result.current).toBe(true);
  });
});
