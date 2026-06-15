import path from "node:path";

import { describe, expect, it } from "vitest";

import { validateSaveTarget } from "./validateSaveTarget.js";

describe("validateSaveTarget", () => {
  const rootDir = path.resolve("/tmp/doc-repo-root");

  it("accepts a markdown document inside the root and matching include patterns", () => {
    const result = validateSaveTarget({
      rootDir,
      identifier: "docs/guide/getting-started.md",
      includePatterns: ["docs/**/*.md"],
      excludePatterns: ["**/drafts/**"],
    });

    expect(result.isValidTarget).toBe(true);
    expect(result.normalizedIdentifier).toBe("docs/guide/getting-started.md");
    expect(result.absolutePath).toBe(path.join(rootDir, "docs/guide/getting-started.md"));
  });

  it("rejects absolute paths", () => {
    const result = validateSaveTarget({
      rootDir,
      identifier: "/tmp/outside.md",
    });

    expect(result.isValidTarget).toBe(false);
    expect(result.reasons).toContain("identifier must be relative to rootDir");
  });

  it("rejects non markdown files", () => {
    const result = validateSaveTarget({
      rootDir,
      identifier: "docs/sample.txt",
    });

    expect(result.isValidTarget).toBe(false);
    expect(result.reasons).toContain("identifier must end with .md");
  });

  it("rejects path traversal", () => {
    const result = validateSaveTarget({
      rootDir,
      identifier: "../outside.md",
    });

    expect(result.isValidTarget).toBe(false);
    expect(result.reasons).toContain("identifier must remain inside rootDir");
  });

  it("rejects excluded targets", () => {
    const result = validateSaveTarget({
      rootDir,
      identifier: "docs/drafts/draft.md",
      includePatterns: ["docs/**/*.md"],
      excludePatterns: ["**/drafts/**"],
    });

    expect(result.isValidTarget).toBe(false);
    expect(result.reasons).toContain("identifier matches exclude patterns");
  });
});
