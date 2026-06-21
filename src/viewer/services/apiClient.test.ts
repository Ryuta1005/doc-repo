import { afterEach, describe, expect, it, vi } from "vitest";

import { createDocument, fetchDocument, fetchSiteConfig } from "./apiClient.js";

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

  it("throws create error details for rejected create requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              status: "rejected",
              error: {
                code: "ALREADY_EXISTS",
                reason: "target:already-exists",
                message: "a document with the same name already exists",
                retryable: false,
              },
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" },
            },
          ),
      ),
    );

    await expect(
      createDocument({
        anchor: { nodeType: "folder", nodePath: "docs" },
        filename: "guide",
      }),
    ).rejects.toThrow("a document with the same name already exists");
  });
});
