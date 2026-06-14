import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchDocument, fetchSiteConfig } from "./apiClient.js";

describe("apiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses JSON error payload messages for failed document requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { message: "Target document was not found." } }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    await expect(fetchDocument("missing.md")).rejects.toThrow("Target document was not found.");
  });

  it("fetches site config", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ name: "Team Docs" }), { status: 200 })),
    );

    await expect(fetchSiteConfig()).resolves.toEqual({ name: "Team Docs" });
  });
});
