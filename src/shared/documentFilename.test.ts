import { describe, expect, it } from "vitest";

import { normalizeMarkdownFilenameInput } from "./documentFilename.js";

describe("normalizeMarkdownFilenameInput", () => {
  it("always appends .md to the entered filename text", () => {
    expect(normalizeMarkdownFilenameInput("example")).toEqual({
      ok: true,
      value: { filenameWithExtension: "example.md", displayName: "example" },
    });
    expect(normalizeMarkdownFilenameInput("already.md")).toEqual({
      ok: true,
      value: { filenameWithExtension: "already.md.md", displayName: "already.md" },
    });
    expect(normalizeMarkdownFilenameInput("doc.ja")).toEqual({
      ok: true,
      value: { filenameWithExtension: "doc.ja.md", displayName: "doc.ja" },
    });
  });

  it("rejects empty and path-like filename input", () => {
    expect(normalizeMarkdownFilenameInput("")).toEqual({ ok: false, reason: "required" });
    expect(normalizeMarkdownFilenameInput("..")).toEqual({ ok: false, reason: "path-segment" });
    expect(normalizeMarkdownFilenameInput("child/example")).toEqual({ ok: false, reason: "path-separator" });
  });
});
