import { afterEach, describe, expect, it, vi } from "vitest";

import { createDocument, deleteDocument, fetchDocument, fetchSiteConfig } from "./apiClient.js";

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

  it("returns create rejection payloads without displaying server messages directly", async () => {
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
    ).resolves.toMatchObject({
      status: "rejected",
      error: {
        code: "ALREADY_EXISTS",
        reason: "target:already-exists",
      },
    });
  });

  it("returns delete rejection payloads without converting them to create errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              status: "rejected",
              error: {
                code: "CONTAINS_UNMANAGED_CONTENT",
                reason: "folder:contains-unmanaged-content",
                message: "folder contains unmanaged content",
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
      deleteDocument({
        target: {
          targetType: "folder",
          path: "docs/mixed",
          displayName: "mixed",
        },
      }),
    ).resolves.toMatchObject({
      status: "rejected",
      error: {
        code: "CONTAINS_UNMANAGED_CONTENT",
        reason: "folder:contains-unmanaged-content",
      },
    });
  });
});
