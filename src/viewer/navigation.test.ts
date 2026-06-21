import { describe, expect, it } from "vitest";

import {
  hrefToIdentifier,
  identifierToPathname,
  pathnameToIdentifier,
  resolveDocumentSwitchDecision,
  resolveIdentifierAfterSave,
  resolveEditableDocumentIdentifier,
  toSidebarLabel,
  validateEditableDocumentFilename,
} from "./navigation.js";

describe("viewer navigation", () => {
  it("converts html pathnames to markdown identifiers", () => {
    expect(pathnameToIdentifier("/project/planning/backlog/index.html")).toBe("project/planning/backlog/index.md");
  });

  it("converts directory pathnames to index markdown identifiers", () => {
    expect(pathnameToIdentifier("/project/planning/backlog/001_epic/")).toBe(
      "project/planning/backlog/001_epic/index.md",
    );
  });

  it("resolves relative markdown links from the current viewer URL", () => {
    expect(
      hrefToIdentifier("../../issue-workflow.html", "http://localhost:4500/project/planning/backlog/index.md"),
    ).toBe("project/issue-workflow.md");
  });

  it("resolves directory links from the current viewer URL to index markdown", () => {
    expect(hrefToIdentifier("./001_epic/", "http://localhost:4500/project/planning/backlog/index.md")).toBe(
      "project/planning/backlog/001_epic/index.md",
    );
  });

  it("rejects external links", () => {
    expect(hrefToIdentifier("https://example.com/docs/a.md", "http://localhost:4500/project/index.md")).toBeNull();
  });

  it("blocks document switch while editing dirty content", () => {
    const decision = resolveDocumentSwitchDecision({
      mode: "edit",
      hasUnsavedChanges: true,
      currentIdentifier: "docs/current.md",
      requestedIdentifier: "docs/next.md",
    });

    expect(decision).toEqual({
      allow: false,
      requireConfirmation: true,
      nextIdentifier: "docs/current.md",
    });
  });

  it("allows document switch when edits are already saved", () => {
    const decision = resolveDocumentSwitchDecision({
      mode: "edit",
      hasUnsavedChanges: false,
      currentIdentifier: "docs/current.md",
      requestedIdentifier: "docs/next.md",
    });

    expect(decision).toEqual({
      allow: true,
      requireConfirmation: false,
      nextIdentifier: "docs/next.md",
    });
  });

  it("returns to view using saved identifier after save success", () => {
    const savedIdentifier = resolveIdentifierAfterSave("docs/guide/getting-started.md", "docs/current.md");
    expect(savedIdentifier).toBe("docs/guide/getting-started.md");

    const pathname = identifierToPathname(savedIdentifier ?? "");
    expect(pathnameToIdentifier(pathname)).toBe("docs/guide/getting-started.md");
  });

  it("maps sidebar labels to extensionless names", () => {
    expect(toSidebarLabel("docs/guide/getting-started.md")).toBe("getting-started");
    expect(toSidebarLabel("docs/guide/getting-started.md", "Custom.md")).toBe("Custom");
  });

  it("resolves edited filenames within the current document directory", () => {
    expect(resolveEditableDocumentIdentifier("docs/guide/getting-started.md", "updated")).toBe("docs/guide/updated.md");
    expect(resolveEditableDocumentIdentifier("docs/guide/getting-started.md", "updated.md")).toBe(
      "docs/guide/updated.md.md",
    );
    expect(resolveEditableDocumentIdentifier("docs/guide/getting-started.md", "doc.ja")).toBe("docs/guide/doc.ja.md");
    expect(resolveEditableDocumentIdentifier("docs/guide/getting-started.md", "example.txt")).toBe(
      "docs/guide/example.txt.md",
    );
  });

  it("rejects invalid editable filenames", () => {
    expect(resolveEditableDocumentIdentifier("docs/guide/getting-started.md", "")).toBeNull();
    expect(resolveEditableDocumentIdentifier("docs/guide/getting-started.md", "nested/name")).toBeNull();
    expect(resolveEditableDocumentIdentifier("docs/guide/getting-started.md", "..")).toBeNull();
  });

  it("returns detailed editable filename validation reasons", () => {
    expect(validateEditableDocumentFilename("nested/name")).toEqual({ ok: false, reason: "path-separator" });
  });
});
