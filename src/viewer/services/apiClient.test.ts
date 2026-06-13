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
          new Response(JSON.stringify({ error: { message: "対象文書が見つかりません。" } }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    await expect(fetchDocument("missing.md")).rejects.toThrow("対象文書が見つかりません。");
  });

  it("fetches site config", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ name: "Team Docs" }), { status: 200 })),
    );

    await expect(fetchSiteConfig()).resolves.toEqual({ name: "Team Docs" });
  });
});
