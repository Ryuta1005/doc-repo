import path from "node:path";

import { describe, expect, it } from "vitest";

import { evaluateDocumentTargetPolicy } from "./documentTargetPolicy.js";

describe("evaluateDocumentTargetPolicy", () => {
  const rootDir = path.resolve("/tmp/doc-repo-root");

  it("accepts markdown identifiers inside rootDir and matching include/exclude rules", () => {
    expect(
      evaluateDocumentTargetPolicy({
        rootDir,
        identifier: "docs/guide.md",
        includePatterns: ["docs/**/*.md", "docs/*.md"],
        excludePatterns: ["**/draft/**"],
      }),
    ).toEqual({
      reasons: [],
      normalizedIdentifier: "docs/guide.md",
      absolutePath: path.join(rootDir, "docs/guide.md"),
    });
  });

  it("rejects rootDir escape and include/exclude violations", () => {
    expect(
      evaluateDocumentTargetPolicy({
        rootDir,
        identifier: "../guide.txt",
        includePatterns: ["docs/**/*.md"],
      }).reasons,
    ).toEqual(
      expect.arrayContaining([
        "identifier must remain inside rootDir",
        "identifier must end with .md",
        "identifier does not match include patterns",
        "identifier resolves outside rootDir",
      ]),
    );
  });
});
