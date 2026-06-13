import { describe, expect, it } from "vitest";

import { resolveSelectedIdentifier } from "./viewerState.js";

describe("viewerState", () => {
  const documents = [
    { identifier: "docs/a.md" },
    { identifier: "docs/b.md" },
  ];

  it("selects first document when no document is selected", () => {
    expect(resolveSelectedIdentifier(null, documents)).toBe("docs/a.md");
  });

  it("keeps current selection when the document still exists", () => {
    expect(resolveSelectedIdentifier("docs/b.md", documents)).toBe("docs/b.md");
  });

  it("keeps missing explicit selection so the viewer can show a recoverable 404", () => {
    expect(resolveSelectedIdentifier("docs/missing.md", documents)).toBe("docs/missing.md");
  });

  it("returns null when there are no documents", () => {
    expect(resolveSelectedIdentifier("docs/missing.md", [])).toBeNull();
  });
});
